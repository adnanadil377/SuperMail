from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('gmailapi.urls')),
    path('contactapi/', include('contact_api.urls')),
    path('user/', include('acc_api.urls')),
    path('agent/', include('agent_api.urls')),
]
