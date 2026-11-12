import uuid
from django.db import models
from core.models import User
from prescriptions.models import Prescription

class MedicalDocument(models.Model):
    class Category(models.TextChoices):
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        LAB_REPORT = "LAB_REPORT", "Lab Test Report"
        DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY", "Discharge Summary"
        IMAGING = "IMAGING", "Imaging / X-Ray / Scan"
        OTHER = "OTHER", "Other Health Document"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medical_documents")
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=40, choices=Category.choices, default=Category.PRESCRIPTION)
    document_file = models.FileField(upload_to="vault/%Y/%m/")
    file_type = models.CharField(max_length=50, blank=True)
    file_size_bytes = models.BigIntegerField(default=0)
    description = models.TextField(blank=True)
    document_date = models.DateField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_confidential = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-document_date", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.category}) - {self.user.email}"

class SharedMedicalRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shared_records_sent")
    professional = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shared_records_received")
    document = models.ForeignKey(MedicalDocument, on_delete=models.CASCADE, null=True, blank=True)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, null=True, blank=True)
    access_granted_at = models.DateTimeField(auto_now_add=True)
    access_expires_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ["-access_granted_at"]

    def __str__(self):
        return f"Share: {self.patient.email} -> Dr. {self.professional.email}"
