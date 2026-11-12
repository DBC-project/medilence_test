import uuid
from django.db import models

class Medicine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    brand_name = models.CharField(max_length=255, blank=True, db_index=True)
    generic_name = models.CharField(max_length=255, db_index=True)
    medicine_category = models.CharField(max_length=150, db_index=True)
    dosage_form = models.CharField(max_length=100, default="Tablet")
    strength = models.CharField(max_length=100, blank=True)
    
    # Information fields
    common_uses = models.TextField(help_text="Primary therapeutic indications")
    common_uses_ml = models.TextField(blank=True, help_text="Malayalam translation of uses")
    
    how_it_works = models.TextField(help_text="Simple educational explanation of mechanism")
    how_it_works_ml = models.TextField(blank=True)
    
    common_side_effects = models.JSONField(default=list)
    common_side_effects_ml = models.JSONField(default=list)
    
    serious_warnings = models.TextField(blank=True)
    serious_warnings_ml = models.TextField(blank=True)
    
    precautions = models.TextField(blank=True)
    precautions_ml = models.TextField(blank=True)
    
    contraindications = models.TextField(blank=True)
    contraindications_ml = models.TextField(blank=True)
    
    food_precautions = models.TextField(blank=True, default="Take as directed by doctor. Drink plenty of water.")
    food_precautions_ml = models.TextField(blank=True)
    
    storage_info = models.CharField(max_length=255, default="Store in a cool, dry place away from direct sunlight.")
    missed_dose_info = models.TextField(blank=True, default="Take as soon as remembered unless close to next dose. Never take a double dose.")
    missed_dose_info_ml = models.TextField(blank=True)
    
    verified_source = models.CharField(max_length=255, default="CDSCO / WHO / MedlinePlus")
    source_reference = models.TextField(blank=True)
    last_verified_date = models.DateField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["generic_name"]),
            models.Index(fields=["brand_name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.generic_name})"

class MedicineIngredient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="ingredients")
    name = models.CharField(max_length=200, db_index=True)
    strength = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.name} ({self.strength}) in {self.medicine.name}"

class MedicineBrand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="brands")
    brand_name = models.CharField(max_length=200, db_index=True)
    manufacturer = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.brand_name} - {self.medicine.name}"

class DrugInteraction(models.Model):
    class Severity(models.TextChoices):
        MINOR = "MINOR", "Minor Interaction (Monitor)"
        MODERATE = "MODERATE", "Moderate Interaction (Caution)"
        POTENTIALLY_SERIOUS = "POTENTIALLY_SERIOUS", "Potentially Serious Interaction (Action Required)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    primary_ingredient = models.CharField(max_length=200, db_index=True)
    secondary_ingredient = models.CharField(max_length=200, db_index=True)
    severity = models.CharField(max_length=30, choices=Severity.choices, default=Severity.MODERATE)
    
    description = models.TextField()
    description_ml = models.TextField(blank=True)
    
    clinical_recommendation = models.TextField(help_text="Guidance to discuss with doctor or pharmacist")
    clinical_recommendation_ml = models.TextField(blank=True)
    
    evidence_source = models.CharField(max_length=255, default="National Drug Formulary / WHO Clinical Guidelines")
    confidence_score = models.FloatField(default=0.95)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("primary_ingredient", "secondary_ingredient")
        ordering = ["-severity"]

    def __str__(self):
        return f"Interaction: {self.primary_ingredient} + {self.secondary_ingredient} [{self.severity}]"

class InteractionEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interaction = models.ForeignKey(DrugInteraction, on_delete=models.CASCADE, related_name="evidences")
    citation = models.TextField()
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Evidence for {self.interaction}"
