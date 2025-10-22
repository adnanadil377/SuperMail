from datetime import timezone
import base64
from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from django.contrib.auth.models import User
from .models import GoogleCredentials
from google.auth.transport.requests import Request
from rest_framework.permissions import IsAuthenticated
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)

CLIENT_SECRETS_FILE = settings.CLIENT_SECRETS_FILE
SCOPES = settings.SCOPES
REDIRECT_URI = settings.REDIRECT_URI
user_creds = None

def get_google_credentials(user):
    print(REDIRECT_URI)
    token = GoogleCredentials.objects.get(user=user)
    user_creds = Credentials(
        token=token.token,
        refresh_token=token.refresh_token,
        token_uri=token.token_uri,
        client_id=token.client_id,
        client_secret=token.client_secret,
        scopes=token.scopes.split(),
    )

    # Refresh if expired
    if user_creds.expired and user_creds.refresh_token:
        user_creds.refresh(Request())
        # Update DB
        token.token = user_creds.token
        token.expiry = user_creds.expiry
        token.save()

    return user_creds


class GoogleAuthView(APIView):
    """
    Step 1: Redirects user to Google's OAuth consent page.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        user_id_encoded = urlsafe_base64_encode(force_bytes(request.user.pk))
        auth_url, _ = flow.authorization_url(
            prompt='consent',
            access_type='offline',
            state=user_id_encoded
        )
        # return HttpResponseRedirect(auth_url)
        return Response({"auth_url":auth_url})


def oauth2callback(request):
    # get state parameter from request
    state = request.GET.get('state')
    if not state:
        return JsonResponse({"error": "Missing state parameter"}, status=400)
    
    try:
        user_id = urlsafe_base64_decode(state).decode()
        User = get_user_model()
        user = User.objects.get(pk=user_id)
    except Exception:
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
        user_creds = flow.credentials

        GoogleCredentials.objects.update_or_create(
            user=user,
            defaults={
                "token": user_creds.token,
                "refresh_token": user_creds.refresh_token,
                "token_uri": user_creds.token_uri,
                "client_id": user_creds.client_id,
                "client_secret": user_creds.client_secret,
                "scopes": " ".join(user_creds.scopes),
                "expiry": user_creds.expiry if user_creds.expiry else timezone.now() + timezone.timedelta(hours=1),
            }
        )
        logger.info("Authentication successful, token saved.")
        return HttpResponseRedirect("http://localhost:5173/settings/connect?google_auth=success")
    except Exception as e:
        logger.error(f"OAuth2 callback failed: {e}")
        return HttpResponseRedirect("http://localhost:5173/settings/connect?google_auth=error")

class EmailListView(APIView):
    """
    Fetches user emails with improved error handling and pagination.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve Gmail messages for authenticated user.
        
        Query parameters:
        - email: Filter by sender/recipient email
        - max_results: Number of emails to fetch (default: 10, max: 100)
        - page_token: For pagination
        """
        try:
            # Get and validate credentials
            creds = get_google_credentials(request.user)
            service = build("gmail", "v1", credentials=creds)
            
            # Parse query parameters
            email_filter = request.query_params.get("email")
            max_results = min(int(request.query_params.get("max_results", 10)), 100)
            page_token = request.query_params.get("page_token")
            
            # Build Gmail query
            query = f"from:{email_filter} OR to:{email_filter}" if email_filter else None
            
            # Fetch message list
            list_params = {
                "userId": "me",
                "maxResults": max_results,
                "q": query
            }
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

            # Fetch message details
            email_data = []
            for msg in messages:
                try:
                    email_detail = self._get_email_detail(service, msg["id"])
                    if email_detail:
                        email_data.append(email_detail)
                except HttpError as e:
                    logger.warning(f"Failed to fetch email {msg['id']}: {e}")
                    continue

            return Response({
                "emails": email_data,
                "next_page_token": next_page_token,
                "total_count": len(email_data)
            })

        except ObjectDoesNotExist:
            return Response(
                {"error": "Google credentials not found. Please authenticate first."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except RefreshError:
            return Response(
                {"error": "Authentication expired. Please re-authenticate."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except HttpError as e:
            logger.error(f"Gmail API error: {e}")
            return Response(
                {"error": "Failed to fetch emails from Gmail"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Unexpected error in EmailListView: {e}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_email_detail(self, service, message_id):
        """
        Extract email details from Gmail message.
        
        Args:
            service: Gmail service instance
            message_id: Gmail message ID
            
        Returns:
            dict: Email details or None if extraction fails
        """
        try:
            msg_detail = service.users().messages().get(
                userId="me", 
                id=message_id,
                format='full'
            ).execute()
            
            headers = msg_detail["payload"]["headers"]
            
            # Extract headers safely
            def get_header(name, default="(Unknown)"):
                return next((h["value"] for h in headers if h["name"].lower() == name.lower()), default)
            
            subject = get_header("Subject", "(No Subject)")
            from_email = get_header("From")
            to_email = get_header("To")
            date = get_header("Date")
            message_id_header = get_header("Message-ID")
            
            # Extract body content
            body = self._extract_body(msg_detail["payload"])
            
            return {
                "id": message_id,
                "from": from_email,
                "to": to_email,
                "subject": subject,
                "date": date,
                "message_id": message_id_header,
                "body": body.strip() if body else "",
                "snippet": msg_detail.get("snippet", "")
            }
            
        except Exception as e:
            logger.error(f"Error extracting email detail for {message_id}: {e}")
            return None
    
    def _extract_body(self, payload):
        """
        Extract email body from message payload.
        
        Args:
            payload: Gmail message payload
            
        Returns:
            str: Email body content
        """
        body = ""
        
        try:
            if "parts" in payload:
                # Multi-part message
                for part in payload["parts"]:
                    if part["mimeType"] == "text/plain" and "data" in part.get("body", {}):
                        body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                        break
                    elif (part["mimeType"] == "text/html" and 
                          not body and 
                          "data" in part.get("body", {})):
                        body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
            else:
                # Single-part message
                if "data" in payload.get("body", {}):
                    body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8")
                    
        except Exception as e:
            logger.error(f"Error extracting body: {e}")
            
        return body