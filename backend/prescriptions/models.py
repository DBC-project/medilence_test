import uuid
from django.db import models
from core.models import User
from medicines.models import Medicine

class Prescription(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", "Uploaded"
        PROCESSING = "PROCESSING", "Processing OCR & AI"
        EXTRACTED = "EXTRACTED", "Awaiting User Confirmation"
        CONFIRMED = "CONFIRMED", "Confirmed by User"
        REVIEWED = "REVIEWED", "Reviewed by Medical Professional"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="prescriptions")
    title = models.CharField(max_length=255, default="Prescription Scan")
    scan_category = models.CharField(
        max_length=30,
        default="PRESCRIPTION",
        choices=[("PRESCRIPTION", "Doctor Prescription"), ("PRODUCT_PACK", "Medicine Box / Strip / Bottle")]
    )
    doctor_name = models.CharField(max_length=200, blank=True)
    clinic_name = models.CharField(max_length=255, blank=True)
    prescription_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.UPLOADED)
    original_file = models.FileField(upload_to="prescriptions/originals/")
    file_type = models.CharField(max_length=50, blank=True)
    raw_extracted_text = models.TextField(blank=True)
    
    has_unclear_handwriting = models.BooleanField(default=False)
    uncertainty_warning = models.TextField(blank=True)
    
    # Review & Sharing
    is_shared_with_doctor = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="prescriptions_reviewed")
    doctor_review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    patient_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.user.email} ({self.status})"

class PrescriptionPage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="pages")
    page_number = models.PositiveIntegerField(default=1)
    page_image = models.ImageField(upload_to="prescriptions/pages/")
    processed_image = models.ImageField(upload_to="prescriptions/processed/", null=True, blank=True)
    extracted_text = models.TextField(blank=True)

    class Meta:
        ordering = ["page_number"]

    def __str__(self):
        return f"Page {self.page_number} of {self.prescription.title}"

class ExtractedPrescriptionText(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="text_blocks")
    block_text = models.TextField()
    confidence_score = models.FloatField(default=0.0)
    is_uncertain = models.BooleanField(default=False)
    bounding_box = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Text block ({self.confidence_score*100:.1f}%)"

class PrescriptionMedicine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="medicines")
    matched_medicine = models.ForeignKey(Medicine, on_delete=models.SET_NULL, null=True, blank=True, related_name="prescription_items")
    
    # Extracted fields
    medicine_name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255, blank=True)
    manufacturer = models.CharField(max_length=255, blank=True)
    generic_name = models.CharField(max_length=255, blank=True)
    active_ingredient = models.CharField(max_length=255, blank=True)
    strength = models.CharField(max_length=100, blank=True)
    dosage_form = models.CharField(max_length=100, default="Tablet")
    prescribed_dose = models.CharField(max_length=100, blank=True) # e.g. "1 Tablet", "5ml"
    frequency = models.CharField(max_length=100, blank=True) # e.g. "Twice a day", "1-0-1"
    duration = models.CharField(max_length=100, blank=True) # e.g. "5 days"
    route_of_administration = models.CharField(max_length=100, default="Oral")
    special_instructions = models.TextField(blank=True) # e.g. "After food"
    
    # Confidence & Uncertainty tracking
    confidence_score = models.FloatField(default=0.85)
    ocr_uncertainty = models.BooleanField(default=False)
    uncertainty_reason = models.CharField(max_length=255, blank=True)
    source_text = models.TextField(blank=True)
    
    # User feedback loop
    user_confirmed = models.BooleanField(default=False)
    user_edited = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medicine_name} - {self.prescribed_dose} ({self.frequency})"

class GeneratedReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="reports")
    language = models.CharField(max_length=10, default="en")
    summary_content = models.JSONField(default=dict)
    pdf_file = models.FileField(upload_to="reports/", null=True, blank=True)
    disclaimer_text = models.TextField(
        default="AI-generated educational information. This report does not replace professional medical advice. Verify all prescription instructions with your healthcare professional."
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"Report ({self.language}) for {self.prescription.title}"
