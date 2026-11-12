import uuid
from django.db import models
from core.models import User
from prescriptions.models import Prescription

class AIConversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_conversations")
    title = models.CharField(max_length=255, default="Prescription Consultation")
    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True, related_name="conversations")
    language = models.CharField(max_length=10, default="en", choices=[("en", "English"), ("ml", "Malayalam")])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.user.email})"

class AIMessage(models.Model):
    class Sender(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "AI Assistant"
        SYSTEM = "system", "System Notice"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=20, choices=Sender.choices, default=Sender.USER)
    message = models.TextField()
    citations = models.JSONField(default=list, blank=True)
    is_emergency_flagged = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.sender}] {self.message[:40]}"
