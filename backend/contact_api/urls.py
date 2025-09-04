from django.urls import path
from . import views
urlpatterns = [
    path('contacts/', views.ContactView.as_view(), name='all_contacts'),
    path('contacts/<int:pk>/', views.ContactDetailView.as_view(), name="contact_detail")
]
