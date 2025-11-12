from django.urls import path
from .views import AiCompose, GoogleAuthView, EmailListView, EmailDetailView, SendEmailView, oauth2callback

urlpatterns = [
    path("auth/", GoogleAuthView.as_view(), name="google_auth"),
    # path("oauth2callback/", GoogleOAuthCallbackView.as_view(), name="oauth_callback"),
    path("oauth2callback/",oauth2callback , name="oauth_callback"),
    path("emails/", EmailListView.as_view(), name="emails"),
    path("emails/<str:email_id>/", EmailDetailView.as_view(), name="email_detail"),
    path("send/", SendEmailView.as_view(), name="send_email"),
    path("aicompose/", AiCompose.as_view(), name="send_email"),
]
