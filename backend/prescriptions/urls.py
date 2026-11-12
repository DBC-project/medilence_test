from django.urls import path, include
from rest_framework.routers import DefaultRouter
from prescriptions.views import (
    PrescriptionViewSet, PrescriptionUploadAndAnalyzeView,
    PrescriptionConfirmView, DoctorReviewPrescriptionView,
    GenerateReportView, DownloadReportPDFView
)

router = DefaultRouter()
router.register(r"prescriptions", PrescriptionViewSet, basename="prescriptions")

urlpatterns = [
    path("prescriptions/upload/", PrescriptionUploadAndAnalyzeView.as_view(), name="prescription-upload"),
    path("prescriptions/<uuid:pk>/confirm/", PrescriptionConfirmView.as_view(), name="prescription-confirm"),
    path("prescriptions/<uuid:pk>/doctor-review/", DoctorReviewPrescriptionView.as_view(), name="prescription-doctor-review"),
    path("reports/generate/<uuid:pk>/", GenerateReportView.as_view(), name="report-generate"),
    path("reports/<uuid:pk>/download/", DownloadReportPDFView.as_view(), name="report-download"),
    path("", include(router.urls)),
]

