from django.urls import path, include
from rest_framework.routers import DefaultRouter
from documents.views import MedicalDocumentViewSet, ShareMedicalRecordView, SharedRecordsWithMeView

router = DefaultRouter()
router.register(r"documents", MedicalDocumentViewSet, basename="documents")

urlpatterns = [
    path("documents/share/", ShareMedicalRecordView.as_view(), name="share-record"),
    path("documents/shared-with-me/", SharedRecordsWithMeView.as_view(), name="shared-records-with-me"),
    path("", include(router.urls)),
]

