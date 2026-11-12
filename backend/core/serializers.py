from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import (
    User, PatientProfile, ProfessionalProfile,
    ProfessionalVerification, AuditLog, Notification, ConsentRecord, SystemConfiguration
)

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name", "full_name",
            "role", "phone_number", "language_preference", "is_email_verified",
            "is_suspended", "created_at"
        ]
        read_only_fields = ["id", "is_suspended", "created_at"]

class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PatientProfile
        fields = "__all__"

class ProfessionalProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProfessionalProfile
        fields = "__all__"

class ProfessionalVerificationSerializer(serializers.ModelSerializer):
    professional = ProfessionalProfileSerializer(read_only=True)

    class Meta:
        model = ProfessionalVerification
        fields = "__all__"

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.PATIENT)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "role", "phone_number", "language_preference"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        
        # Create corresponding profile
        if user.role == User.Role.PATIENT:
            PatientProfile.objects.create(user=user)
        elif user.role == User.Role.PROFESSIONAL:
            ProfessionalProfile.objects.create(user=user)

        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = AuditLog
        fields = "__all__"

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"

class ConsentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentRecord
        fields = "__all__"

class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = "__all__"

