from django.urls import path
from . import views

urlpatterns = [
    path('send/', views.send_email_with_agent, name='agent_send_email'),
    path('health/', views.agent_health, name='agent_health'),
]
