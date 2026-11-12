from rest_framework import serializers
from reminders.models import MedicationSchedule, MedicationReminder, MedicationLog

class MedicationReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationReminder
        fields = "__all__"
        read_only_fields = ["id"]

class MedicationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationLog
        fields = "__all__"
        read_only_fields = ["id", "logged_at"]

class MedicationScheduleSerializer(serializers.ModelSerializer):
    reminders = MedicationReminderSerializer(many=True, required=False)
    logs = MedicationLogSerializer(many=True, read_only=True)

    class Meta:
        model = MedicationSchedule
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def create(self, validated_data):
        reminders_data = self.context.get("request").data.get("reminders", [])
        schedule = MedicationSchedule.objects.create(
            user=self.context.get("request").user,
            **validated_data
        )
        for r_data in reminders_data:
            MedicationReminder.objects.create(
                schedule=schedule,
                reminder_time=r_data.get("reminder_time", "08:00:00"),
                label=r_data.get("label", "Daily Dose"),
                days_of_week=r_data.get("days_of_week", ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])
            )
        return schedule

