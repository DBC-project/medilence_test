"""
URL configuration for MediSense AI platform.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Core API Endpoints
    path("api/", include("core.urls")),
    path("api/", include("medicines.urls")),
    path("api/", include("prescriptions.urls")),
    path("api/", include("reminders.urls")),
    path("api/", include("assistant.urls")),
    path("api/", include("documents.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
