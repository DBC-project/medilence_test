from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from reminders.models import MedicationSchedule, MedicationReminder, MedicationLog
from reminders.serializers import MedicationScheduleSerializer, MedicationLogSerializer

class MedicationScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MedicationSchedule.objects.filter(user=self.request.user).prefetch_related("reminders", "logs")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MedicationLogActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            schedule = MedicationSchedule.objects.get(id=pk, user=request.user)
        except MedicationSchedule.DoesNotExist:
            return Response({"error": "Schedule not found."}, status=status.HTTP_404_NOT_FOUND)

        log_status = request.data.get("status", MedicationLog.Status.TAKEN)
        notes = request.data.get("notes", "")

        log = MedicationLog.objects.create(
            schedule=schedule,
            scheduled_time=timezone.now(),
            status=log_status,
            notes=notes
        )

        return Response(MedicationLogSerializer(log).data, status=status.HTTP_201_CREATED)
