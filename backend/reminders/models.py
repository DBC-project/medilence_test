import uuid
from django.db import models
from core.models import User
from prescriptions.models import Prescription

class MedicationSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medication_schedules")
    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True, related_name="schedules")
    medicine_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100, default="1 tablet")
    frequency = models.CharField(max_length=100, default="Once daily")
    instructions = models.CharField(max_length=255, blank=True, default="Take after food")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.medicine_name} - {self.user.email}"

class MedicationReminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(MedicationSchedule, on_delete=models.CASCADE, related_name="reminders")
    reminder_time = models.TimeField()
    label = models.CharField(max_length=100, default="Daily Dose")
    days_of_week = models.JSONField(default=list, blank=True) # ['MON', 'TUE', ...]
    is_enabled = models.BooleanField(default=True)

    class Meta:
        ordering = ["reminder_time"]

    def __str__(self):
        return f"{self.schedule.medicine_name} at {self.reminder_time} ({self.label})"

class MedicationLog(models.Model):
    class Status(models.TextChoices):
        TAKEN = "TAKEN", "Taken"
        SKIPPED = "SKIPPED", "Skipped"
        MISSED = "MISSED", "Missed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(MedicationSchedule, on_delete=models.CASCADE, related_name="logs")
    reminder = models.ForeignKey(MedicationReminder, on_delete=models.SET_NULL, null=True, blank=True)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TAKEN)
    logged_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-scheduled_time"]

    def __str__(self):
        return f"{self.schedule.medicine_name} - {self.status} at {self.scheduled_time}"
