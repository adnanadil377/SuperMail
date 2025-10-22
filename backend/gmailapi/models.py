from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json


class GoogleCredentials(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="google_credentials")
    token = models.TextField()
    refresh_token = models.TextField(blank=True, null=True)
    token_uri = models.TextField()
    # client_id = models.TextField()
    # client_secret = models.TextField()
    scopes = models.TextField()
    expiry = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def to_dict(self):
        """Convert stored credentials to dict for google.oauth2.credentials.Credentials"""
        return {
            "token": self.token,
            "refresh_token": self.refresh_token,
            "token_uri": self.token_uri,
            # "client_id": self.client_id,
            # "client_secret": self.client_secret,
            "scopes": json.loads(self.scopes) if isinstance(self.scopes, str) else self.scopes,
            "expiry": self.expiry,
        }
