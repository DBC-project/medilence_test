from django.urls import path, include
from rest_framework.routers import DefaultRouter
from reminders.views import MedicationScheduleViewSet, MedicationLogActionView

router = DefaultRouter()
router.register(r"reminders", MedicationScheduleViewSet, basename="reminders")

urlpatterns = [
    path("reminders/<uuid:pk>/log/", MedicationLogActionView.as_view(), name="reminder-log"),
    path("", include(router.urls)),
]

