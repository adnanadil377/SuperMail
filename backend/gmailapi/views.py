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
        return JsonResponse({"error": "Invalid user in state"}, status=400)
    
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state
    )
    
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
    print("Authentication successful, token saved.")
    return HttpResponseRedirect("http://localhost:5173/settings/connect?google_auth=success")


class EmailListView(APIView):
    """
    Fetches user emails (optionally filtered by email).
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):

        try:
            # creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            creds = get_google_credentials(request.user)
            service = build("gmail", "v1", credentials=creds)
            email = request.query_params.get("email")
            query = f"from:{email} OR to:{email}" if email else None
            results = service.users().messages().list(
                userId="me",
                maxResults=10,
                q=query
            ).execute()

            messages = results.get("messages", [])
            email_data = []

            for msg in messages:
                msg_detail = service.users().messages().get(userId="me", id=msg["id"]).execute()
                headers = msg_detail["payload"]["headers"]

                subject = next((h["value"] for h in headers if h["name"] == "Subject"), "(No Subject)")
                frm = next((h["value"] for h in headers if h["name"] == "From"), "(Unknown)")
                to = next((h["value"] for h in headers if h["name"] == "To"), "(Unknown)")
                date = next((h["value"] for h in headers if h["name"] == "Date"), "(Unknown)")
                message_id = next((h["value"] for h in headers if h["name"] == "Message-ID"), "(Unknown)")

                # Extract body
                body = ""
                payload = msg_detail["payload"]

                if "parts" in payload:
                    for part in payload["parts"]:
                        if part["mimeType"] == "text/plain" and "data" in part["body"]:
                            body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                            break
                        elif part["mimeType"] == "text/html" and not body and "data" in part["body"]:
                            body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                else:
                    if "data" in payload["body"]:
                        body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8")

                email_data.append({
                    "from": frm,
                    "to": to,
                    "subject": subject,
                    "date": date,
                    "message_id": message_id,
                    "body": body.strip()
                })

            return Response({"emails": email_data})

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
