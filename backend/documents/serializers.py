from rest_framework import serializers
from documents.models import MedicalDocument, SharedMedicalRecord
from core.serializers import UserSerializer

class MedicalDocumentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.full_name")

    class Meta:
        model = MedicalDocument
        fields = "__all__"
        read_only_fields = ["id", "user", "file_size_bytes", "created_at", "updated_at"]

class SharedMedicalRecordSerializer(serializers.ModelSerializer):
    patient_detail = UserSerializer(source="patient", read_only=True)
    professional_detail = UserSerializer(source="professional", read_only=True)
    document_detail = MedicalDocumentSerializer(source="document", read_only=True)

    class Meta:
        model = SharedMedicalRecord
        fields = "__all__"
        read_only_fields = ["id", "patient", "access_granted_at"]

