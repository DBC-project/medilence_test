from rest_framework import serializers
from prescriptions.models import Prescription, PrescriptionPage, ExtractedPrescriptionText, PrescriptionMedicine, GeneratedReport
from medicines.serializers import MedicineSerializer

class PrescriptionMedicineSerializer(serializers.ModelSerializer):
    matched_medicine_detail = MedicineSerializer(source="matched_medicine", read_only=True)

    class Meta:
        model = PrescriptionMedicine
        fields = "__all__"
        read_only_fields = ["id", "prescription", "created_at", "updated_at"]

class PrescriptionPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionPage
        fields = "__all__"

class GeneratedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedReport
        fields = "__all__"

class PrescriptionSerializer(serializers.ModelSerializer):
    medicines = PrescriptionMedicineSerializer(many=True, read_only=True)
    pages = PrescriptionPageSerializer(many=True, read_only=True)
    reports = GeneratedReportSerializer(many=True, read_only=True)
    patient_name = serializers.ReadOnlyField(source="user.full_name")
    patient_email = serializers.ReadOnlyField(source="user.email")
    reviewed_by_name = serializers.ReadOnlyField(source="reviewed_by.full_name")

    class Meta:
        model = Prescription
        fields = "__all__"
        read_only_fields = ["id", "user", "status", "created_at", "updated_at"]

