from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User
from medicines.models import Medicine, DrugInteraction
from prescriptions.models import Prescription, PrescriptionMedicine
from assistant.ai_service import check_emergency_symptoms, process_assistant_query
from prescriptions.report_generator import build_report_data, generate_pdf_report

class MediSensePlatformTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            email="patient_test@medisense.ai",
            password="Password@123",
            first_name="Test",
            last_name="Patient",
            role=User.Role.PATIENT
        )
        self.doctor = User.objects.create_user(
            email="doctor_test@medisense.ai",
            password="Password@123",
            first_name="Dr. Test",
            last_name="Doctor",
            role=User.Role.PROFESSIONAL
        )

        self.med1 = Medicine.objects.create(
            name="Augmentin 625 Duo Tablet",
            brand_name="Augmentin",
            generic_name="Amoxicillin and Potassium Clavulanate",
            medicine_category="Antibiotic",
            common_uses="Bacterial infections",
            common_uses_ml="ബാക്ടീരിയൽ അണുബാധകൾക്ക്"
        )
        self.med2 = Medicine.objects.create(
            name="Dolo 650 Tablet",
            brand_name="Dolo",
            generic_name="Paracetamol",
            medicine_category="Analgesic",
            common_uses="Fever and pain relief",
            common_uses_ml="പനിയും വേദനയും"
        )

        self.interaction = DrugInteraction.objects.create(
            primary_ingredient="Warfarin",
            secondary_ingredient="Aspirin",
            severity=DrugInteraction.Severity.POTENTIALLY_SERIOUS,
            description="Extreme risk of internal bleeding",
            clinical_recommendation="Do not combine without doctor supervision."
        )

    def test_user_authentication_jwt(self):
        """Tests that login returns valid JWT access and refresh tokens."""
        url = reverse("auth-login")
        res = self.client.post(url, {
            "email": "patient_test@medisense.ai",
            "password": "Password@123"
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["email"], "patient_test@medisense.ai")

    def test_interaction_checker(self):
        """Tests pairwise drug interaction checker and duplicate detection."""
        url = reverse("interactions-check")
        res = self.client.post(url, {
            "medicine_names": ["Warfarin", "Aspirin"],
            "language": "en"
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "POTENTIALLY_SERIOUS")

    def test_ai_emergency_symptom_guardrail(self):
        """Tests that emergency symptoms trigger immediate warning advice."""
        query_en = "I am having severe chest pain radiating to left arm and cannot breathe"
        res_en = process_assistant_query(query_en, language="en")
        self.assertTrue(res_en["is_emergency"])
        self.assertIn("EMERGENCY", res_en["message"])

        query_ml = "എനിക്ക് കഠിനമായ നെഞ്ചുവേദനയും ശ്വാസമെടുക്കാൻ ബുദ്ധിമുട്ടും ഉണ്ട്"
        res_ml = process_assistant_query(query_ml, language="ml")
        self.assertTrue(res_ml["is_emergency"])
        self.assertIn("അടിയന്തര", res_ml["message"])

    def test_pdf_report_generation(self):
        """Tests that structured report data builds and compiles valid PDF bytes."""
        rx = Prescription.objects.create(
            user=self.patient,
            title="General Checkup Prescription",
            status=Prescription.Status.CONFIRMED
        )
        PrescriptionMedicine.objects.create(
            prescription=rx,
            matched_medicine=self.med1,
            medicine_name=self.med1.name,
            generic_name=self.med1.generic_name,
            prescribed_dose="1 tab",
            frequency="Twice daily",
            duration="5 days",
            user_confirmed=True
        )

        data = build_report_data(rx, language="en")
        self.assertIn("medicines", data)
        self.assertEqual(len(data["medicines"]), 1)

        pdf_bytes = generate_pdf_report(data)
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_open_source_packaging_extraction(self):
        """Tests that packaging text from tubes/bottles/strips extracts correctly with open-source AI parser."""
        from prescriptions.ocr_service import parse_medical_scan_data
        sample_tube_text = "80 ml 2% Sali-Cinamide Anti-Acne Face Wash 2% Salicylic Acid Niacinamide The Derma Co."
        items = parse_medical_scan_data(sample_tube_text, scan_category="PRODUCT_PACK")
        self.assertTrue(len(items) >= 1)
        item = items[0]
        self.assertIn("Sali-Cinamide", item["medicine_name"])
        self.assertEqual(item["route_of_administration"], "Topical")
        self.assertFalse(item["ocr_uncertainty"])

    def test_large_dataset_drug_interactions(self):
        """Tests that topical drug interactions (e.g. Salicylic acid + Benzoyl peroxide) are detected."""
        DrugInteraction.objects.create(
            primary_ingredient="Salicylic Acid",
            secondary_ingredient="Benzoyl Peroxide",
            severity=DrugInteraction.Severity.MODERATE,
            description="Causes excessive peeling and barrier breakdown if applied simultaneously."
        )
        url = reverse("interactions-check")
        res = self.client.post(url, {
            "medicine_names": ["Salicylic Acid", "Benzoyl Peroxide"],
            "language": "en"
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "ATTENTION_REQUIRED")
        self.assertTrue(len(res.data["interactions"]) >= 1)
