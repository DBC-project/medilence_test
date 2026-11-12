from rest_framework import viewsets, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from medicines.models import Medicine, DrugInteraction
from medicines.serializers import MedicineSerializer, DrugInteractionSerializer, InteractionCheckRequestSerializer

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.prefetch_related("ingredients", "brands").filter(is_active=True)
    serializer_class = MedicineSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "generic_name", "brand_name", "medicine_category", "ingredients__name"]
    ordering_fields = ["name", "last_verified_date"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class MedicineLookupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = request.data.get("query", "").strip()
        if not query:
            return Response([])

        medicines = Medicine.objects.filter(
            Q(name__icontains=query) |
            Q(generic_name__icontains=query) |
            Q(brand_name__icontains=query) |
            Q(ingredients__name__icontains=query)
        ).distinct()[:10]

        return Response(MedicineSerializer(medicines, many=True).data)

class DrugInteractionCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = InteractionCheckRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        med_ids = serializer.validated_data.get("medicine_ids", [])
        med_names = serializer.validated_data.get("medicine_names", [])
        language = serializer.validated_data.get("language", "en")

        matched_meds = []
        if med_ids:
            matched_meds.extend(list(Medicine.objects.filter(id__in=med_ids)))
        if med_names:
            for name in med_names:
                m = Medicine.objects.filter(
                    Q(name__icontains=name) | Q(generic_name__icontains=name) | Q(brand_name__icontains=name)
                ).first()
                if m and m not in matched_meds:
                    matched_meds.append(m)

        # Collect active ingredients
        ingredients_map = {}
        for med in matched_meds:
            for ing in med.ingredients.all():
                ing_clean = ing.name.strip()
                if ing_clean not in ingredients_map:
                    ingredients_map[ing_clean] = []
                ingredients_map[ing_clean].append(med.name)

        # Also support raw ingredient names directly if provided in medicine_names
        for name in med_names:
            clean_name = name.strip()
            # If not already represented in ingredients
            if not any(clean_name.lower() in k.lower() for k in ingredients_map.keys()):
                ingredients_map[clean_name] = [clean_name]

        # Check for duplicates
        duplicate_alerts = []
        for ing_name, associated_meds in ingredients_map.items():
            if len(associated_meds) > 1:
                duplicate_alerts.append({
                    "ingredient": ing_name,
                    "medicines": associated_meds,
                    "severity": "POTENTIALLY_SERIOUS",
                    "title": f"Duplicate Active Ingredient: {ing_name}",
                    "description": (
                        f"Multiple selected medicines ({', '.join(associated_meds)}) contain the active ingredient '{ing_name}'. "
                        "Taking multiple brands with identical ingredients risks unintentional cumulative overdose."
                        if language == "en" else
                        f"നിങ്ങൾ തിരഞ്ഞെടുത്ത ഒന്നിലധികം മരുന്നുകളിൽ ({', '.join(associated_meds)}) '{ing_name}' എന്ന ഒരേ ചേരുവ അടങ്ങിയിരിക്കുന്നു. ഇത് ശരീരത്തിൽ മരുന്നിന്റെ അളവ് അമിതമാകാൻ (Overdose) കാരണമായേക്കാം."
                    ),
                    "recommendation": (
                        "Do not take these medications concurrently without consulting your doctor or pharmacist to confirm the total daily dosage."
                        if language == "en" else
                        "ഡോക്ടറോടോ ഫാർമസിസ്റ്റിനോടോ സംസാരിച്ച് കൃത്യമായ അളവ് ഉറപ്പുവരുത്താതെ ഈ മരുന്നുകൾ ഒരുമിച്ച് കഴിക്കരുത്."
                    )
                })

        # Check pairwise interactions
        interactions_found = []
        ing_keys = list(ingredients_map.keys())
        
        for i in range(len(ing_keys)):
            for j in range(i + 1, len(ing_keys)):
                k1, k2 = ing_keys[i], ing_keys[j]
                matches = DrugInteraction.objects.filter(
                    (Q(primary_ingredient__icontains=k1) & Q(secondary_ingredient__icontains=k2)) |
                    (Q(primary_ingredient__icontains=k2) & Q(secondary_ingredient__icontains=k1))
                )
                for match in matches:
                    interactions_found.append({
                        "id": str(match.id),
                        "primary_ingredient": match.primary_ingredient,
                        "secondary_ingredient": match.secondary_ingredient,
                        "severity": match.severity,
                        "description": match.description_ml if language == "ml" and match.description_ml else match.description,
                        "recommendation": match.clinical_recommendation_ml if language == "ml" and match.clinical_recommendation_ml else match.clinical_recommendation,
                        "evidence_source": match.evidence_source,
                        "confidence_score": match.confidence_score,
                    })

        # Overall safety status classification
        if any(item["severity"] == "POTENTIALLY_SERIOUS" for item in interactions_found) or len(duplicate_alerts) > 0:
            overall_status = "POTENTIALLY_SERIOUS"
            summary_message = (
                "Potentially serious interactions or duplicate active ingredients were detected. Immediate pharmacist or physician review is strongly recommended."
                if language == "en" else
                "ഗുരുതരമായ പ്രതിപ്രവർത്തനങ്ങളോ ഒരേ ചേരുവകൾ ആവർത്തിക്കുന്നതോ കണ്ടെത്തിയിട്ടുണ്ട്. ദയവായി ഡോക്ടറുടെയോ ഫാർമസിസ്റ്റിന്റെയോ നിർദ്ദേശം തേടുക."
            )
        elif len(interactions_found) > 0:
            overall_status = "ATTENTION_REQUIRED"
            summary_message = (
                "Interactions requiring attention were identified. Review the recommendations and mention them to your doctor."
                if language == "en" else
                "ശ്രദ്ധിക്കേണ്ട ചില മരുന്ന് പ്രതിപ്രവർത്തനങ്ങൾ കണ്ടെത്തിയിട്ടുണ്ട്. ഡോക്ടറോട് സംസാരിക്കുക."
            )
        else:
            overall_status = "NO_KNOWN_INTERACTION_IN_DATABASE"
            summary_message = (
                "No known interaction identified in our verified database. Note that an unchecked combination is never guaranteed to be completely safe; always follow your physician's prescription."
                if language == "en" else
                "ഞങ്ങളുടെ പരിശോധിച്ച ഡാറ്റാബേസിൽ അറിയപ്പെടുന്ന പ്രതിപ്രവർത്തനങ്ങൾ ഒന്നും കണ്ടെത്തിയിട്ടില്ല. എങ്കിലും ഡോക്ടറുടെ നിർദ്ദേശങ്ങൾ മാത്രം പിന്തുടരുക."
            )

        return Response({
            "status": overall_status,
            "summary": summary_message,
            "medicines_checked": [MedicineSerializer(m).data for m in matched_meds],
            "duplicate_alerts": duplicate_alerts,
            "interactions": interactions_found,
            "disclaimer": (
                "MediSense AI interaction checks provide clinical reference information from trusted pharmacopeias. "
                "Never stop or adjust your prescribed medication without speaking directly to your healthcare provider."
                if language == "en" else
                "മെഡിസെൻസ് AI നൽകുന്ന വിവരങ്ങൾ റഫറൻസിന് മാത്രമുള്ളതാണ്. ഡോക്ടറുടെ അനുവാദമില്ലാതെ ഒരിക്കലും മരുന്നുകൾ നിർത്തുകയോ മാറ്റുകയോ ചെയ്യരുത്."
            )
        })
