from rest_framework import serializers
from medicines.models import Medicine, MedicineIngredient, MedicineBrand, DrugInteraction, InteractionEvidence

class MedicineIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineIngredient
        fields = ["id", "name", "strength"]

class MedicineBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineBrand
        fields = ["id", "brand_name", "manufacturer"]

class MedicineSerializer(serializers.ModelSerializer):
    ingredients = MedicineIngredientSerializer(many=True, read_only=True)
    brands = MedicineBrandSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = "__all__"

class InteractionEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionEvidence
        fields = ["id", "citation", "url"]

class DrugInteractionSerializer(serializers.ModelSerializer):
    evidences = InteractionEvidenceSerializer(many=True, read_only=True)

    class Meta:
        model = DrugInteraction
        fields = "__all__"

class InteractionCheckRequestSerializer(serializers.Serializer):
    medicine_ids = serializers.ListField(child=serializers.CharField(), required=False)
    medicine_names = serializers.ListField(child=serializers.CharField(), required=False)
    language = serializers.CharField(default="en")

