# views.py

import base64
import json
import logging
from datetime import timezone, timedelta
from google import genai
from google.genai import types

from pydantic import BaseModel

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse, HttpResponseRedirect
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError

from .models import GoogleCredentials

logger = logging.getLogger(__name__)

# --- Configuration loaded from settings.py ---
CLIENT_SECRETS_FILE = settings.CLIENT_SECRETS_FILE
SCOPES = settings.SCOPES
REDIRECT_URI = settings.REDIRECT_URI


def get_google_credentials(user):
    """
    Retrieves and refreshes Google credentials for a given user from the database.
    Application-specific secrets (client_id, client_secret) are loaded from settings.
    """
    token_obj = GoogleCredentials.objects.get(user=user)
    
    creds = Credentials(
        token=token_obj.token,
        refresh_token=token_obj.refresh_token,
        token_uri=token_obj.token_uri,
        client_id=settings.GOOGLE_CLIENT_ID,  # Loaded from settings for security
        client_secret=settings.GOOGLE_CLIENT_SECRET,  # Loaded from settings
        scopes=token_obj.scopes.split(),
    )

    # If credentials have expired, refresh them and update the database
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_obj.token = creds.token
        token_obj.expiry = creds.expiry
        token_obj.save(update_fields=['token', 'expiry'])
        logger.info(f"Refreshed token for user {user.pk}")

    return creds


class GoogleAuthView(APIView):
    """
    Step 1: Redirects the user to Google's OAuth consent page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Encode the user's ID to securely pass it through the OAuth flow
        user_id_encoded = urlsafe_base64_encode(force_bytes(request.user.pk))
        
        auth_url, _ = flow.authorization_url(
            prompt='consent',
            access_type='offline',
            state=user_id_encoded
        )
        return Response({"auth_url": auth_url})


def oauth2callback(request):
    """
    Step 2: Handles the callback from Google after user consent.
    Exchanges the authorization code for credentials and saves them.
    """
    state = request.GET.get('state')
    if not state:
        return JsonResponse({"error": "Missing state parameter"}, status=400)
    
    try:
        user_id = urlsafe_base64_decode(state).decode()
        User = get_user_model()
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        logger.error("Invalid user in state during OAuth callback")
        return JsonResponse({"error": "Invalid user in state"}, status=400)
    
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state
    )
    
    try:
        flow.fetch_token(authorization_response=request.build_absolute_uri())
        creds = flow.credentials

        # Save the user-specific credentials to the database
        GoogleCredentials.objects.update_or_create(
            user=user,
            defaults={
                "token": creds.token,
                "refresh_token": creds.refresh_token,
                "token_uri": creds.token_uri,
                "scopes": " ".join(creds.scopes),
                "expiry": creds.expiry,
            }
        )
        logger.info(f"Authentication successful for user {user.pk}, token saved.")

        # Update the user's email address from Gmail profile
        from googleapiclient.discovery import build

        try:
            # Build Gmail service with the new credentials
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            gmail_address = profile.get("emailAddress")
            if gmail_address:
                user.email = gmail_address
                user.save(update_fields=["email"])
                logger.info(f"Updated user {user.pk} email to {gmail_address}")
        except Exception as e:
            logger.error(f"Failed to update user email from Gmail profile: {e}")

        # Redirect to a frontend page indicating success
        return HttpResponseRedirect("http://localhost:5173/settings/connect?google_auth=success")

    except Exception as e:
        logger.error(f"OAuth2 callback failed for user {user.pk}: {e}")
        # Redirect to a frontend page indicating an error
        return HttpResponseRedirect("http://localhost:5173/settings/connect?google_auth=error")


class EmailListView(APIView):
    """
    Fetches user emails with improved error handling, pagination, and performance.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve Gmail messages for the authenticated user using efficient batching.
        
        Query parameters:
        - email: Filter by sender/recipient email
        - max_results: Number of emails to fetch (default: 10, max: 100)
        - page_token: For pagination
        """
        try:
            creds = get_google_credentials(request.user)
            service = build("gmail", "v1", credentials=creds)
            
            email_filter = request.query_params.get("email")
            max_results = min(int(request.query_params.get("max_results", 10)), 100)
            page_token = request.query_params.get("page_token")
            
            query = f"from:{email_filter} OR to:{email_filter}" if email_filter else None
            
            list_params = {"userId": "me", "maxResults": max_results}
            if query:
                list_params["q"] = query
            if page_token:
                list_params["pageToken"] = page_token
                
            results = service.users().messages().list(**list_params).execute()
            messages = results.get("messages", [])
            next_page_token = results.get("nextPageToken")
            
            if not messages:
                return Response({
                    "emails": [], 
                    "next_page_token": None, 
                    "total_count": 0
                })

            # --- Performance Improvement: Use a Batch Request ---
            email_data = []
            batch = service.new_batch_http_request(
                callback=self._batch_callback_factory(email_data)
            )

            for msg in messages:
                batch.add(service.users().messages().get(userId="me", id=msg["id"], format="full"))

            batch.execute()
            # --- End of Batch Request ---

            return Response({
                "emails": email_data,
                "next_page_token": next_page_token,
                "total_count": len(email_data)
            })

        except ObjectDoesNotExist:
            return Response({"error": "Google credentials not found. Please authenticate first."}, status=status.HTTP_401_UNAUTHORIZED)
        except RefreshError:
            return Response({"error": "Authentication expired. Please re-authenticate."}, status=status.HTTP_401_UNAUTHORIZED)
        except HttpError as e:
            logger.error(f"Gmail API error for user {request.user.pk}: {e}")
            return Response({"error": f"Failed to fetch emails from Gmail: {e.reason}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"Unexpected error in EmailListView for user {request.user.pk}: {e}")
            return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _batch_callback_factory(self, email_data_list):
        """Creates a callback function to process results from the batch request."""
        def callback(request_id, response, exception):
            if exception:
                logger.error(f"Error in batch request item {request_id}: {exception}")
                return

            try:
                headers = response["payload"]["headers"]
                def get_header(name, default="(Unknown)"):
                    return next((h["value"] for h in headers if h["name"].lower() == name.lower()), default)
                
                body = self._extract_body(response["payload"])
                
                email_detail = {
                    "id": response["id"],
                    "from": get_header("From"),
                    "to": get_header("To"),
                    "subject": get_header("Subject", "(No Subject)"),
                    "date": get_header("Date"),
                    "message_id": get_header("Message-ID"),
                    "body": body.strip(),
                    "snippet": response.get("snippet", "")
                }
                email_data_list.append(email_detail)
            except Exception as e:
                logger.error(f"Error processing batch response item {request_id}: {e}")
        
        return callback

    def _extract_body(self, payload):
        """Recursively extracts the plain text body from a message payload."""
        body = ""
        if "parts" in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain' and 'data' in part.get('body', {}):
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                # Recurse for nested parts
                elif 'parts' in part:
                    nested_body = self._extract_body(part)
                    if nested_body:
                        return nested_body
        elif "data" in payload.get("body", {}):
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
        return body


class SendEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Expects JSON body: { "to": "...", "subject": "...", "body": "..." }
        """
        to = request.data.get("to")
        subject = request.data.get("subject")
        body = request.data.get("body")
        if not (to and subject and body):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            creds = get_google_credentials(request.user)
            service = build("gmail", "v1", credentials=creds)

            # Create MIME message
            message = MIMEText(body)
            message["to"] = to
            message["subject"] = subject

            # Encode message
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

            # Send email
            send_message = (
                service.users().messages().send(
                    userId="me",
                    body={"raw": raw}
                ).execute()
            )
            return Response({"message_id": send_message["id"]}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return Response({"error": "Failed to send email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class Email(BaseModel):
    subject: str
    body: str

class AiCompose(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            client = genai.Client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=request.data.get("body"),
                config=types.GenerateContentConfig(
                    system_instruction=f"You are a helpful email assistant. Always write professional and polite emails based on the user's request. Give with proper format with newline and new tab etc in body and. name = {request.user} to={request.data.get("to")}",
                    response_mime_type="application/json",
                    response_schema=Email,
                ),
            )
            
            # Parse the JSON response
            email_data = json.loads(response.text)
            print(email_data)
            
            # Return as a proper dict
            return Response(email_data, status=status.HTTP_200_OK)
            
            # Alternative: Use parsed objects if available
            # email_obj = response.parsed
            # return Response({
            #     "subject": email_obj.subject,
            #     "body": email_obj.body
            # }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return Response(
                {"error": "Invalid JSON response from AI service.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            print(f"An error occurred: {e}")
            return Response(
                {"error": "Failed to generate content from the AI service.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )