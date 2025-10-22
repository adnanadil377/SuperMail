from django.urls import path
from .views import GoogleAuthView, EmailListView, SendEmailView, oauth2callback

urlpatterns = [
    path("auth/", GoogleAuthView.as_view(), name="google_auth"),
    # path("oauth2callback/", GoogleOAuthCallbackView.as_view(), name="oauth_callback"),
    path("oauth2callback/",oauth2callback , name="oauth_callback"),
    path("emails/", EmailListView.as_view(), name="emails"),
    path("emails/", EmailListView.as_view(), name="emails_filtered"),
    path("send/", SendEmailView.as_view(), name="send_email"),
]
