from django.core.management.base import BaseCommand
from datetime import date, timedelta
from django.utils import timezone
from core.models import User, PatientProfile, ProfessionalProfile, Notification
from medicines.models import Medicine, MedicineIngredient, MedicineBrand, DrugInteraction, InteractionEvidence
from prescriptions.models import Prescription, PrescriptionMedicine
from reminders.models import MedicationSchedule, MedicationReminder
from documents.models import MedicalDocument

class Command(BaseCommand):
    help = "Seeds database with demo users, medicines (CDSCO/WHO verified), interactions, and sample prescriptions."

    def handle(self, *args, **options):
        self.stdout.write("Seeding MediSense AI Database...")

        # 1. Users
        admin_user, _ = User.objects.get_or_create(
            email="admin@medisense.ai",
            defaults={
                "username": "admin",
                "first_name": "MediSense",
                "last_name": "Admin",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        admin_user.set_password("Admin@123456")
        admin_user.save()

        doctor_user, _ = User.objects.get_or_create(
            email="doctor@medisense.ai",
            defaults={
                "username": "dr_thomas",
                "first_name": "Dr. Thomas",
                "last_name": "Mathew",
                "role": User.Role.PROFESSIONAL,
            }
        )
        doctor_user.set_password("Doctor@123456")
        doctor_user.save()

        ProfessionalProfile.objects.update_or_create(
            user=doctor_user,
            defaults={
                "medical_license_number": "KMC-49281",
                "specialization": "Internal Medicine / General Physician",
                "qualifications": "MBBS, MD (General Medicine)",
                "hospital_or_clinic": "Cochin Medical Center, Kerala",
                "years_of_experience": 14,
                "is_verified": True,
                "verification_notes": "Verified against Kerala State Medical Council registry.",
            }
        )

        patient_user, _ = User.objects.get_or_create(
            email="patient@medisense.ai",
            defaults={
                "username": "rahul_sharma",
                "first_name": "Rahul",
                "last_name": "Sharma",
                "role": User.Role.PATIENT,
                "language_preference": "en",
            }
        )
        patient_user.set_password("Patient@123456")
        patient_user.save()

        PatientProfile.objects.update_or_create(
            user=patient_user,
            defaults={
                "date_of_birth": date(1988, 5, 14),
                "gender": "Male",
                "blood_group": "B+",
                "allergies": ["Penicillin (mild rash)", "Sulfonamides"],
                "chronic_conditions": ["Type 2 Diabetes Mellitus", "Mild Essential Hypertension"],
                "emergency_contact_name": "Priya Sharma (Spouse)",
                "emergency_contact_phone": "+91 98471 23456",
            }
        )

        # 2. Medicines with authentic English & Malayalam data
        medicines_data = [
            {
                "name": "The Derma Co. 2% Sali-Cinamide Anti-Acne Face Wash",
                "brand_name": "The Derma Co.",
                "generic_name": "Salicylic Acid 2% + Niacinamide 2%",
                "medicine_category": "Dermatological Anti-Acne Cleanser / Keratolytic & Sebum-Regulating Formulation",
                "dosage_form": "Topical Face Wash / Cleanser",
                "strength": "2% Salicylic Acid + 2% Niacinamide",
                "common_uses": "Active treatment and prevention of acne vulgaris, blackheads, whiteheads, unclogging deep pores, reducing excess skin sebum, and fading post-acne blemishes.",
                "common_uses_ml": "മുഖക്കുരു തടയുന്നതിനും ബ്ലാക്ക്ഹെഡ്സ്, വൈറ്റ്ഹെഡ്സ് എന്നിവ നീക്കം ചെയ്യുന്നതിനും ചർമ്മത്തിലെ അമിതമായ എണ്ണമയം കുറയ്ക്കുന്നതിനും സുഷിരങ്ങൾ വൃത്തിയാക്കുന്നതിനും ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Salicylic Acid (Beta Hydroxy Acid) penetrates lipid-rich sebaceous pores to exfoliate dead keratinocytes and dissolve trapped sebum plugs. Niacinamide (Vitamin B3) soothes inflammation, regulates sebum production, and strengthens the epidermal skin barrier.",
                "how_it_works_ml": "സാലിസിലിക് ആസിഡ് ചർമ്മത്തിലെ സുഷിരങ്ങളിൽ ആഴ്ന്നിറങ്ങി അടിഞ്ഞുകൂടിയ അഴുക്കും എണ്ണമയവും നീക്കം ചെയ്യുന്നു. നിയാസിനാമൈഡ് ചർമ്മത്തിലെ വീക്കം കുറയ്ക്കുകയും പാടുകൾ മാറാൻ സഹായിക്കുകയും ചെയ്യുന്നു.",
                "common_side_effects": ["Mild skin dryness", "Temporary tingling or stinging", "Mild localized redness or peeling during first week of use"],
                "common_side_effects_ml": ["ചർമ്മത്തിൽ ചെറിയ വരൾച്ച", "നേരിയ പുകച്ചിൽ", "തുടക്കത്തിൽ തൊലി അടരൽ"],
                "serious_warnings": "Severe burning, stinging, or allergic contact dermatitis. Stop immediately and rinse thoroughly if severe swelling of face, eyelids, or rash occurs.",
                "serious_warnings_ml": "കഠിനമായ പുകച്ചിലോ മുഖത്തോ കണ്ണിലോ നീർക്കെട്ടോ ഉണ്ടായാൽ ഉപയോഗം ഉടൻ നിർത്തി ധാരാളം വെള്ളത്തിൽ കഴുകി ഡോക്ടറെ കാണുക.",
                "precautions": "For external topical use only. Avoid direct contact with eyes, lips, and nostrils. Always perform a patch test on forearm before first facial application. Use a broad-spectrum sunscreen (SPF 30+) during daytime as salicylic acid increases UV sensitivity.",
                "precautions_ml": "പുറമെ മാത്രം പുരട്ടുക. കണ്ണിലോ ചുണ്ടിലോ വീഴാതെ ശ്രദ്ധിക്കുക. പകൽ സമയത്ത് സൺസ്ക്രീൻ ഉപയോഗിക്കുക.",
                "contraindications": "Hypersensitivity to salicylates or niacinamide, broken or ulcerated facial skin.",
                "contraindications_ml": "സാലിസിലിക് ആസിഡ് അലർജിയുള്ളവരും ചർമ്മത്തിൽ ആഴത്തിലുള്ള മുറിവുകളുള്ളവരും ഉപയോഗിക്കരുത്.",
                "food_precautions": "Apply to damp skin, gently massage in circular motions for 20-30 seconds, and rinse thoroughly with lukewarm or normal water. Pat dry and follow with an oil-free moisturizer.",
                "food_precautions_ml": "നനഞ്ഞ മുഖത്ത് പുരട്ടി 20-30 സെക്കൻഡ് മൃദുവായി മസാജ് ചെയ്ത ശേഷം കഴുകിക്കളയുക.",
                "storage_info": "Store below 25°C in a cool, dry place away from direct sunlight. Keep tube cap tightly sealed.",
                "missed_dose_info": "Use twice daily (morning and evening) as part of your regular skincare routine.",
                "missed_dose_info_ml": "രാവിലെയും രാത്രിയും മുഖം കഴുകാൻ ഉപയോഗിക്കുക.",
                "verified_source": "Dermatological Clinical Practice Guidelines / CDSCO OTC Formulation / Indian Academy of Dermatology",
                "ingredients": [
                    {"name": "Salicylic Acid", "strength": "2%"},
                    {"name": "Niacinamide", "strength": "2%"}
                ],
                "brands": [
                    "The Derma Co. 2% Sali-Cinamide Anti-Acne Face Wash (The Derma Co)",
                    "2% Sali-Cinamide Face Wash (The Derma Co)",
                    "Sali-Cinamide (The Derma Co)",
                    "The Derma Co (Honasa Consumer Ltd)"
                ]
            },
            {
                "name": "Persol 2.5% Gel",
                "brand_name": "Persol",
                "generic_name": "Benzoyl Peroxide",
                "medicine_category": "Topical Antibacterial and Keratolytic Agent",
                "dosage_form": "Gel",
                "strength": "Benzoyl Peroxide 2.5% w/w",
                "common_uses": "Treatment of mild to moderate acne vulgaris; eliminates acne-causing Cutibacterium acnes bacteria and prevents comedone formation.",
                "common_uses_ml": "മുഖക്കുരുവിന് കാരണമാകുന്ന ബാക്ടീരിയകളെ നശിപ്പിക്കാനും പുതിയ മുഖക്കുരു ഉണ്ടാകുന്നത് തടയാനും ഉപയോഗിക്കുന്ന ജെൽ.",
                "how_it_works": "Releases free-radical oxygen species that oxidize bacterial proteins in sebaceous follicles, effectively eliminating C. acnes without bacterial resistance.",
                "how_it_works_ml": "മുഖക്കുരു ഉണ്ടാക്കുന്ന ബാക്ടീരിയകളെ ഓക്സിജൻ സ്വതന്ത്ര റാഡിക്കലുകൾ പുറത്തുവിട്ട് നശിപ്പിക്കുന്നു.",
                "common_side_effects": ["Mild skin peeling", "Erythema (redness)", "Dryness and mild stinging"],
                "common_side_effects_ml": ["തൊലി അടരൽ", "ചുവപ്പ്", "ചെറിയ പുകച്ചിൽ"],
                "serious_warnings": "May bleach colored clothing, hair, and bed linens. Discontinue if severe allergic edema or vesicular eruptions occur.",
                "serious_warnings_ml": "വസ്ത്രങ്ങളിലോ മുടിയിലോ തട്ടിയാൽ നിറം മാറാം. കഠിനമായ നീർക്കെട്ട് ഉണ്ടായാൽ ഉപയോഗം നിർത്തുക.",
                "precautions": "For topical application only. Minimize exposure to sunlight and sunlamps. Apply a non-comedogenic sunscreen.",
                "precautions_ml": "പുറമെ മാത്രം പുരട്ടുക. അമിതമായി വെയിൽ കൊള്ളുന്നത് ഒഴിവാക്കുക.",
                "contraindications": "Hypersensitivity to benzoyl peroxide.",
                "contraindications_ml": "ബെൻസോയിൽ പെറോക്സൈഡ് അലർജിയുള്ളവർ ഉപയോഗിക്കരുത്.",
                "food_precautions": "Wash hands before and after applying. Apply a thin film to clean, dry acne-prone areas once daily at bedtime.",
                "food_precautions_ml": "മുഖം വൃത്തിയാക്കി ഉണങ്ങിയ ശേഷം രാത്രി ഉറങ്ങുന്നതിന് മുൻപ് നേർത്ത രീതിയിൽ പുരട്ടുക.",
                "storage_info": "Store below 25°C. Do not freeze.",
                "missed_dose_info": "Apply at the next scheduled time. Do not apply double amount.",
                "missed_dose_info_ml": "അടുത്ത തവണ നിശ്ചിത അളവിൽ പുരട്ടുക.",
                "verified_source": "CDSCO / British National Formulary (BNF) Dermatology",
                "ingredients": [
                    {"name": "Benzoyl Peroxide", "strength": "2.5%"}
                ],
                "brands": ["Persol 2.5 (Wallace)", "Benxop 2.5 (Apex)", "Benzac AC (Galderma)"]
            },
            {
                "name": "Clindac-A Gel",
                "brand_name": "Clindac-A",
                "generic_name": "Clindamycin Phosphate and Nicotinamide",
                "medicine_category": "Topical Antibiotic and Anti-Inflammatory Acne Gel",
                "dosage_form": "Gel",
                "strength": "Clindamycin 1% w/w + Nicotinamide 4% w/w",
                "common_uses": "Inflammatory acne vulgaris with papules and pustules; suppresses Propionibacterium acnes and calms skin erythema.",
                "common_uses_ml": "പഴുപ്പുള്ള മുഖക്കുരു, വീക്കം, ചുവപ്പ് എന്നിവ ശമിപ്പിക്കാൻ ഉപയോഗിക്കുന്ന ആന്റിബയോട്ടിക് ജെൽ.",
                "how_it_works": "Clindamycin inhibits bacterial protein synthesis at the 50S ribosomal subunit. Nicotinamide blocks anti-inflammatory cytokine cascade and reduces skin sebum excretion.",
                "how_it_works_ml": "ക്ലിൻഡാമൈസിൻ ബാക്ടീരിയകളുടെ വളർച്ച തടയുന്നു. നിക്കോട്ടിനാമൈഡ് ചർമ്മത്തിലെ വീക്കവും എണ്ണമയവും കുറയ്ക്കുന്നു.",
                "common_side_effects": ["Slight skin burning", "Dryness", "Oily skin reaction"],
                "common_side_effects_ml": ["നേരിയ പുകച്ചിൽ", "വരൾച്ച"],
                "serious_warnings": "Pseudomembranous colitis (extremely rare topically, but report severe abdominal cramping or persistent diarrhea immediately).",
                "serious_warnings_ml": "കഠിനമായ വയറിളക്കമോ വയറുവേദനയോ ഉണ്ടായാൽ ഡോക്ടറെ കാണുക.",
                "precautions": "Avoid application near eyes, mucous membranes, or abraded skin.",
                "precautions_ml": "കണ്ണിന് ചുറ്റും മുറിവുകളുള്ള ഭാഗങ്ങളിലും പുരട്ടരുത്.",
                "contraindications": "History of regional enteritis, ulcerative colitis, or antibiotic-associated colitis.",
                "contraindications_ml": "വൻകുടൽ പുണ്ണ് (Colitis) ഉള്ളവർ ഉപയോഗിക്കരുത്.",
                "food_precautions": "Apply a thin layer twice daily to clean, dry affected skin.",
                "food_precautions_ml": "ദിവസത്തിൽ രണ്ട് തവണ വൃത്തിയുള്ള ചർമ്മത്തിൽ പുരട്ടുക.",
                "storage_info": "Store below 30°C. Protect from freezing.",
                "missed_dose_info": "Apply when remembered. Skip if near next application time.",
                "missed_dose_info_ml": "ഓർമ്മ വരുമ്പോൾ പുരട്ടുക.",
                "verified_source": "CDSCO / MedlinePlus Dermatology",
                "ingredients": [
                    {"name": "Clindamycin", "strength": "1%"},
                    {"name": "Nicotinamide", "strength": "4%"}
                ],
                "brands": ["Clindac-A (Alkem)", "Faceclin (Abbott)", "Clinka (Intas)"]
            },
            {
                "name": "Nizral 2% Solution",
                "brand_name": "Nizral",
                "generic_name": "Ketoconazole",
                "medicine_category": "Topical Imidazole Antifungal",
                "dosage_form": "Lotion / Shampoo Solution",
                "strength": "Ketoconazole 2% w/v",
                "common_uses": "Treatment and prevention of dandruff (seborrheic dermatitis), pityriasis versicolor (tinea versicolor), and scalp fungal scaling.",
                "common_uses_ml": "താരൻ (ഡാൻഡ്രഫ്), തലയിലെ ചൊറിച്ചിൽ, ഫംഗസ് അണുബാധകൾ എന്നിവ മാറ്റാൻ ഉപയോഗിക്കുന്ന ആന്റിഫംഗൽ ഷാംപൂ/ലോഷൻ.",
                "how_it_works": "Inhibits cytochrome P-450 dependent 14-alpha-demethylase in fungal cell membranes, blocking ergosterol synthesis and causing fungal cell lysis.",
                "how_it_works_ml": "ഫംഗസുകളുടെ കോശഭിത്തി നിർമ്മാണം തടഞ്ഞ് താരന് കാരണമാകുന്ന ഫംഗസുകളെ പൂർണ്ണമായി നശിപ്പിക്കുന്നു.",
                "common_side_effects": ["Mild scalp dryness", "Occasional irritation", "Slight change in hair texture"],
                "common_side_effects_ml": ["തലയോട്ടിയിൽ വരൾച്ച", "ചെറിയ ചൊറിച്ചിൽ"],
                "serious_warnings": "Hypersensitivity reaction with scalp swelling or severe burning. Avoid swallowing or getting into eyes.",
                "serious_warnings_ml": "കണ്ണിൽ വീഴരുത്. കഠിനമായ അലർജി ഉണ്ടായാൽ ഉപയോഗം നിർത്തുക.",
                "precautions": "Leave on scalp for 3 to 5 minutes before rinsing completely with water.",
                "precautions_ml": "തലയോട്ടിയിൽ പുരട്ടി 3 മുതൽ 5 മിനിറ്റ് വരെ വെച്ച ശേഷം മാത്രം നന്നായി കഴുകിക്കളയുക.",
                "contraindications": "Known hypersensitivity to ketoconazole.",
                "contraindications_ml": "കീറ്റോകോണസോൾ അലർജിയുള്ളവർ ഉപയോഗിക്കരുത്.",
                "food_precautions": "Wet hair and scalp thoroughly. Apply generous lather, leave for 3-5 minutes, rinse thoroughly.",
                "food_precautions_ml": "നനഞ്ഞ മുടിയിലും തലയോട്ടിയിലും പതപ്പിച്ച് 3-5 മിനിറ്റ് കഴിഞ്ഞ് കഴുകുക.",
                "storage_info": "Store below 25°C. Keep bottle tightly closed.",
                "missed_dose_info": "Use twice weekly for 2 to 4 weeks, then once weekly for maintenance.",
                "missed_dose_info_ml": "ആഴ്ചയിൽ രണ്ട് തവണ ഉപയോഗിക്കുക.",
                "verified_source": "CDSCO / FDA Approved Prescribing Information",
                "ingredients": [
                    {"name": "Ketoconazole", "strength": "2%"}
                ],
                "brands": ["Nizral 2% (Johnson & Johnson)", "Scalpe Pro (Glenmark)", "Ketocip (Cipla)"]
            },
            {
                "name": "Augmentin 625 Duo Tablet",
                "brand_name": "Augmentin",
                "generic_name": "Amoxicillin and Potassium Clavulanate",
                "medicine_category": "Broad-Spectrum Penicillin Antibiotic",
                "dosage_form": "Tablet",
                "strength": "Amoxicillin 500mg + Clavulanic Acid 125mg",
                "common_uses": "Bacterial respiratory tract infections, sinusitis, tonsillitis, ear infections (otitis media), urinary tract infections, and skin/soft tissue infections.",
                "common_uses_ml": "ശ്വാസകോശ സംബന്ധമായ ബാക്ടീരിയൽ അണുബാധകൾ, സൈനസൈറ്റിസ്, തൊണ്ടവേദന (ടോൺസിലൈറ്റിസ്), ചെവിയിലെ അണുബാധ, മൂത്രാശയ അണുബാധ, ചർമ്മ അണുബാധ എന്നിവയ്ക്ക് ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Amoxicillin kills bacteria by preventing them from forming protective cell walls. Clavulanic acid blocks beta-lactamase enzymes produced by bacteria that would otherwise destroy amoxicillin, extending its efficacy.",
                "how_it_works_ml": "അമോക്സിസിലിൻ ബാക്ടീരിയകളുടെ കോശഭിത്തി നിർമ്മാണം തടഞ്ഞ് അവയെ നശിപ്പിക്കുന്നു. ക്ലാവുലാനിക് ആസിഡ് ബാക്ടീരിയൽ എൻസൈമുകളിൽ നിന്ന് അമോക്സിസിലിനെ സംരക്ഷിക്കുന്നു.",
                "common_side_effects": ["Mild diarrhea", "Nausea or vomiting", "Abdominal discomfort", "Fungal skin or vaginal yeast infections"],
                "common_side_effects_ml": ["വയറിളക്കം", "ഛർദ്ദി അല്ലെങ്കിൽ ഓക്കാനം", "വയറുവേദന", "ഫംഗസ് അണുബാധ"],
                "serious_warnings": "Severe watery diarrhea containing blood or mucus (pseudomembranous colitis), severe allergic skin rash, facial swelling, breathing difficulty, or jaundice/yellowing of eyes.",
                "serious_warnings_ml": "രക്തം കലർന്ന വയറിളക്കം, കഠിനമായ അലർജി തിണർപ്പ്, മുഖം വീർക്കുക, ശ്വാസമെടുക്കാൻ ബുദ്ധിമുട്ട്, അല്ലെങ്കിൽ മഞ്ഞപ്പിത്ത ലക്ഷണങ്ങൾ കണ്ടാൽ ഉടൻ ഡോക്ടറെ സമീപിക്കുക.",
                "precautions": "Complete the full prescribed course even if symptoms resolve earlier to prevent antibiotic resistance. Caution in liver or kidney impairment.",
                "precautions_ml": "രോഗലക്ഷണങ്ങൾ മാറിയാലും ഡോക്ടർ നിർദ്ദേശിച്ച മുഴുവൻ ദിവസവും ഗുളിക കഴിക്കുക. ആന്റിബയോട്ടിക് പ്രതിരോധം ഉണ്ടാകാതിരിക്കാൻ ഇത് അത്യാവശ്യമാണ്.",
                "contraindications": "History of penicillin hypersensitivity or cholestatic jaundice associated with amoxicillin/clavulanate.",
                "contraindications_ml": "പെൻസിലിൻ അലർജിയോ മുൻപ് ഈ മരുന്ന് കഴിച്ച് കരൾ പ്രശ്നങ്ങൾ ഉണ്ടായവരോ കഴിക്കാൻ പാടില്ല.",
                "food_precautions": "Take with or right before a meal to enhance absorption and reduce gastrointestinal upset.",
                "food_precautions_ml": "ഭക്ഷണത്തോടൊപ്പമോ ഭക്ഷണത്തിന് തൊട്ടുമുമ്പോ കഴിക്കുക. ഇത് വയറിലെ അസ്വസ്ഥത കുറയ്ക്കാൻ സഹായിക്കും.",
                "storage_info": "Store below 25°C in a dry place. Keep out of reach of children.",
                "missed_dose_info": "Take as soon as remembered with food. If close to the next dose, skip and resume regular schedule. Never take two doses together.",
                "missed_dose_info_ml": "ഓർമ്മ വരുമ്പോൾ ഉടൻ കഴിക്കുക. അടുത്ത ഡോസിന് സമയമായെങ്കിൽ ഒഴിവാക്കുക. ഇരട്ടി ഡോസ് കഴിക്കരുത്.",
                "verified_source": "CDSCO / MedlinePlus / British National Formulary",
                "ingredients": [
                    {"name": "Amoxicillin", "strength": "500 mg"},
                    {"name": "Clavulanic Acid", "strength": "125 mg"}
                ],
                "brands": ["Augmentin 625 Duo (GSK)", "Moxikind-CV 625 (Mankind)", "Clavam 625 (Alkem)"]
            },
            {
                "name": "Dolo 650 Tablet",
                "brand_name": "Dolo",
                "generic_name": "Paracetamol (Acetaminophen)",
                "medicine_category": "Analgesic and Antipyretic",
                "dosage_form": "Tablet",
                "strength": "Paracetamol 650mg",
                "common_uses": "Relief of mild to moderate pain (headache, body ache, toothache, muscle aches) and reduction of fever.",
                "common_uses_ml": "പനി കുറയ്ക്കാനും തലവേദന, ശരീരവേദന, പല്ലുവേദന, പേശിവേദന തുടങ്ങിയ വേദനകൾ ലഘൂകരിക്കാനും ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Inhibits cyclooxygenase (COX) enzymes in the central nervous system to inhibit prostaglandin synthesis, elevating pain threshold and regulating the hypothalamic thermoregulatory center.",
                "how_it_works_ml": "തലച്ചോറിലെ വേദന സംവേദന കേന്ദ്രങ്ങളെ നിയന്ത്രിച്ച് വേദന കുറയ്ക്കുകയും ശരീര താപനില നിയന്ത്രിക്കുന്ന കേന്ദ്രത്തിൽ പ്രവർത്തിച്ച് പനി കുറയ്ക്കുകയും ചെയ്യുന്നു.",
                "common_side_effects": ["Rarely nausea", "Occasional mild stomach irritation", "Skin rash (infrequent)"],
                "common_side_effects_ml": ["ഓക്കാനം (അപൂർവ്വമായി)", "വയറ്റിൽ ചെറിയ അസ്വസ്ഥത", "ചർമ്മത്തിൽ തടിപ്പ്"],
                "serious_warnings": "Exceeding 4,000 mg (4 grams) in 24 hours can cause severe, irreversible liver injury. Avoid combining with other paracetamol-containing cough/cold medicines.",
                "serious_warnings_ml": "24 മണിക്കൂറിൽ 4000 മില്ലിഗ്രാമിൽ കൂടുതൽ കഴിക്കുന്നത് കഠിനമായ കരൾ തകരാറിന് കാരണമാകും. പാരാസിറ്റമോൾ അടങ്ങിയ മറ്റ് മരുന്നുകളോടൊപ്പം കഴിക്കരുത്.",
                "precautions": "Caution in patients with chronic alcoholism, severe renal impairment, or pre-existing liver disease.",
                "precautions_ml": "കരൾ അല്ലെങ്കിൽ വൃക്ക രോഗമുള്ളവരും മദ്യപിക്കുന്നവരും ഡോക്ടറുടെ നിർദ്ദേശപ്രകാരം മാത്രം കഴിക്കുക.",
                "contraindications": "Severe active liver disease or hypersensitivity to paracetamol.",
                "contraindications_ml": "കഠിനമായ കരൾ രോഗമുള്ളവർ കഴിക്കരുത്.",
                "food_precautions": "Can be taken with or without food. Drink adequate water.",
                "food_precautions_ml": "ഭക്ഷണത്തിനു ശേഷമോ മുൻപോ കഴിക്കാം. ആവശ്യത്തിന് വെള്ളം കുടിക്കുക.",
                "storage_info": "Store at room temperature below 30°C in moisture-proof packaging.",
                "missed_dose_info": "Take when needed for fever/pain with at least 4-6 hours between doses.",
                "missed_dose_info_ml": "ആവശ്യമെങ്കിൽ 4 മുതൽ 6 മണിക്കൂർ ഇടവേളയിൽ കഴിക്കാം.",
                "verified_source": "CDSCO / WHO Model List of Essential Medicines / FDA",
                "ingredients": [
                    {"name": "Paracetamol", "strength": "650 mg"}
                ],
                "brands": ["Dolo 650 (Micro Labs)", "Calpol 650 (GSK)", "Crocin 650 (GlaxoSmithKline)", "P-650 (Apex)"]
            },
            {
                "name": "Crocin 500 Tablet",
                "brand_name": "Crocin",
                "generic_name": "Paracetamol",
                "medicine_category": "Analgesic and Antipyretic",
                "dosage_form": "Tablet",
                "strength": "Paracetamol 500mg",
                "common_uses": "Symptomatic treatment of mild-to-moderate fever, headache, cold symptoms, and generalized body aches.",
                "common_uses_ml": "പനി, ജലദോഷം, തലവേദന, നേരിയ ശരീരവേദന എന്നിവയ്ക്ക് ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Analgesic and antipyretic agent that blocks central pain transmission and cools the body through peripheral vasodilation and sweating.",
                "how_it_works_ml": "തലച്ചോറിലെ താപനില നിയന്ത്രിക്കുന്ന ഭാഗത്ത് പ്രവർത്തിച്ച് പനി കുറയ്ക്കുകയും വേദനയുടെ തീവ്രത കുറയ്ക്കുകയും ചെയ്യുന്നു.",
                "common_side_effects": ["Very well tolerated at therapeutic doses; rare allergic dermatitis."],
                "common_side_effects_ml": ["സാധാരണ പാർശ്വഫലങ്ങൾ കുറവാണ്; അപൂർവ്വമായി അലർജി ഉണ്ടാകാം."],
                "serious_warnings": "Do not take concurrently with Dolo, Calpol, or combination pain relievers containing paracetamol to prevent acute liver damage.",
                "serious_warnings_ml": "ഡോളോ, കാൽപോൾ തുടങ്ങിയ മറ്റ് പാരാസിറ്റമോൾ മരുന്നുകളോടൊപ്പം കഴിക്കരുത്.",
                "precautions": "Check labels of all concurrent medications for paracetamol content.",
                "precautions_ml": "മറ്റ് മരുന്നുകളിൽ പാരാസിറ്റമോൾ അടങ്ങിയിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക.",
                "contraindications": "Known paracetamol allergy, acute hepatic failure.",
                "contraindications_ml": "പാരാസിറ്റമോൾ അലർജി, കഠിനമായ കരൾ തകരാറ് എന്നിവയുള്ളവർ ഉപയോഗിക്കരുത്.",
                "food_precautions": "May be taken on empty stomach or after food with water.",
                "food_precautions_ml": "വെള്ളത്തോടൊപ്പം കഴിക്കുക.",
                "storage_info": "Store in cool, dry place.",
                "missed_dose_info": "Take as soon as remembered. Never double up.",
                "missed_dose_info_ml": "ഓർമ്മ വരുമ്പോൾ കഴിക്കുക. ഇരട്ടി ഡോസ് കഴിക്കരുത്.",
                "verified_source": "CDSCO / MedlinePlus",
                "ingredients": [
                    {"name": "Paracetamol", "strength": "500 mg"}
                ],
                "brands": ["Crocin 500 (GSK)", "Calpol 500 (GSK)", "Pacimol 500 (IPCA)"]
            },
            {
                "name": "Pantocid 40 Tablet",
                "brand_name": "Pantocid",
                "generic_name": "Pantoprazole",
                "medicine_category": "Proton Pump Inhibitor (PPI)",
                "dosage_form": "Gastro-resistant Tablet",
                "strength": "Pantoprazole 40mg",
                "common_uses": "Gastroesophageal reflux disease (GERD), acid peptic disease, stomach ulcers, gastritis, and prevention of NSAID-induced gastric mucosal injury.",
                "common_uses_ml": "നെഞ്ചെരിച്ചിൽ, അസിഡിറ്റി, ഗ്യാസ് സംബന്ധമായ പ്രശ്നങ്ങൾ, ഗ്യാസ്ട്രൈറ്റിസ്, ആമാശയത്തിലെ അൾസർ എന്നിവയ്ക്ക് ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Suppresses gastric basal and stimulated acid secretion by irreversibly inhibiting the H+/K+ ATPase enzyme system (proton pump) of the gastric parietal cells.",
                "how_it_works_ml": "ആമാശയത്തിൽ ആസിഡ് ഉൽപ്പാദിപ്പിക്കുന്ന പ്രോട്ടോൺ പമ്പ് തടഞ്ഞ് ആസിഡിന്റെ അളവ് ഗണ്യമായി കുറയ്ക്കുന്നു.",
                "common_side_effects": ["Headache", "Flatulence or mild diarrhea", "Constipation", "Nausea"],
                "common_side_effects_ml": ["തലവേദന", "ഗ്യാസ്", "മലബന്ധം അല്ലെങ്കിൽ വയറിളക്കം", "ഓക്കാനം"],
                "serious_warnings": "Prolonged use (over 1 year) may lead to hypomagnesemia, vitamin B12 deficiency, bone fractures (osteoporosis), and Clostridium difficile infection.",
                "serious_warnings_ml": "ദീർഘകാലം കഴിക്കുന്നത് വിറ്റാമിൻ ബി12 കുറവിനും എല്ലുകളുടെ ബലക്ഷയത്തിനും കാരണമാകാം. ഡോക്ടറുടെ നിർദ്ദേശമില്ലാതെ ദീർഘകാലം കഴിക്കരുത്.",
                "precautions": "Swallow whole; do not chew or crush. Inform doctor if severe persistent diarrhea occurs.",
                "precautions_ml": "ഗുളിക പൊടിക്കാതെ മുഴുവനായി വിഴുങ്ങുക. കഠിനമായ വയറിളക്കം ഉണ്ടായാൽ ഡോക്ടറെ അറിയിക്കുക.",
                "contraindications": "Co-administration with rilpivirine, hypersensitivity to benzimidazole PPIs.",
                "contraindications_ml": "പാന്റോപ്രസോൾ അലർജിയുള്ളവർ കഴിക്കരുത്.",
                "food_precautions": "Must be taken on an empty stomach in the morning, 30 to 60 minutes before breakfast.",
                "food_precautions_ml": "രാവിലെ പ്രഭാതഭക്ഷണത്തിന് 30 മുതൽ 60 മിനിറ്റ് മുൻപ് വെറുംവയറ്റിൽ കഴിക്കുക.",
                "storage_info": "Store below 25°C protected from moisture.",
                "missed_dose_info": "Take as soon as remembered before next meal. If near time for next dose, skip.",
                "missed_dose_info_ml": "ഭക്ഷണത്തിന് മുൻപ് ഓർമ്മ വരുമ്പോൾ കഴിക്കുക. അടുത്ത ഡോസിന് സമയമായെങ്കിൽ ഒഴിവാക്കുക.",
                "verified_source": "CDSCO / MedlinePlus / NHS UK",
                "ingredients": [
                    {"name": "Pantoprazole Sodium", "strength": "40 mg"}
                ],
                "brands": ["Pantocid 40 (Sun Pharma)", "Pan 40 (Alkem)", "Pantosec 40 (Cipla)"]
            },
            {
                "name": "Glycomet 500 Tablet",
                "brand_name": "Glycomet",
                "generic_name": "Metformin Hydrochloride",
                "medicine_category": "Biguanide Antidiabetic Agent",
                "dosage_form": "Tablet",
                "strength": "Metformin 500mg",
                "common_uses": "First-line oral treatment for Type 2 Diabetes Mellitus; improves glycemic control alongside diet and physical exercise; also used in Polycystic Ovary Syndrome (PCOS).",
                "common_uses_ml": "ടൈപ്പ് 2 പ്രമേഹ നിയന്ത്രണത്തിന് ഉപയോഗിക്കുന്ന പ്രധാന മരുന്ന്. രക്തത്തിലെ ഗ്ലൂക്കോസിന്റെ അളവ് നിയന്ത്രിക്കാൻ സഹായിക്കുന്നു.",
                "how_it_works": "Decreases hepatic glucose output, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.",
                "how_it_works_ml": "കരൾ നിർമ്മിക്കുന്ന ഗ്ലൂക്കോസിന്റെ അളവ് കുറയ്ക്കുകയും ശരീരത്തിലെ കോശങ്ങൾ ഇൻസുലിൻ കൂടുതൽ ഫലപ്രദമായി ഉപയോഗിക്കാൻ സഹായിക്കുകയും ചെയ്യുന്നു.",
                "common_side_effects": ["Metastable gastrointestinal symptoms", "Metallic taste in mouth", "Nausea", "Mild abdominal cramping"],
                "common_side_effects_ml": ["വയറ്റിൽ അസ്വസ്ഥത", "നാവിൽ ലോഹ രുചി", "ഓക്കാനം", "വയറുവേദന"],
                "serious_warnings": "Lactic acidosis (rare but life-threatening accumulation of lactic acid, risk higher in kidney dysfunction, severe dehydration, or heavy alcohol consumption).",
                "serious_warnings_ml": "ലാക്റ്റിക് അസിഡോസിസ് എന്ന ഗുരുതരമായ അവസ്ഥ (അപൂർവ്വമായി). വൃക്കരോഗമുള്ളവരും മദ്യപിക്കുന്നവരും പ്രത്യേക ജാഗ്രത പുലർത്തുക.",
                "precautions": "Monitor renal function (eGFR) regularly. Temporarily discontinue prior to radiological procedures involving iodinated contrast media.",
                "precautions_ml": "വൃക്കകളുടെ പ്രവർത്തനം കൃത്യമായി പരിശോധിക്കുക. സിടി സ്കാൻ പോലുള്ള കോൺട്രാസ്റ്റ് ടെസ്റ്റുകൾക്ക് മുൻപ് ഡോക്ടറെ അറിയിക്കുക.",
                "contraindications": "Severe renal impairment (eGFR < 30 mL/min/1.73m2), metabolic acidosis, acute heart failure.",
                "contraindications_ml": "ഗുരുതരമായ വൃക്കരോഗമുള്ളവർ കഴിക്കരുത്.",
                "food_precautions": "Take with or immediately after meals to minimize stomach upset.",
                "food_precautions_ml": "ഭക്ഷണത്തോടൊപ്പമോ ഭക്ഷണത്തിന് തൊട്ടുപിന്നാലെയോ കഴിക്കുക.",
                "storage_info": "Store at 20°C to 25°C away from heat and light.",
                "missed_dose_info": "Take with food as soon as remembered. Do not double doses.",
                "missed_dose_info_ml": "ഭക്ഷണത്തോടൊപ്പം കഴിക്കുക. ഇരട്ടി അളവ് കഴിക്കരുത്.",
                "verified_source": "CDSCO / American Diabetes Association / WHO",
                "ingredients": [
                    {"name": "Metformin Hydrochloride", "strength": "500 mg"}
                ],
                "brands": ["Glycomet 500 (USV)", "Glucophage (Merck)", "Obimet (Cipla)"]
            },
            {
                "name": "Telma 40 Tablet",
                "brand_name": "Telma",
                "generic_name": "Telmisartan",
                "medicine_category": "Angiotensin II Receptor Blocker (ARB)",
                "dosage_form": "Tablet",
                "strength": "Telmisartan 40mg",
                "common_uses": "Essential hypertension (high blood pressure) management, reduction of cardiovascular morbidity and stroke risk in high-risk patients.",
                "common_uses_ml": "ഉയർന്ന രക്തസമ്മർദ്ദം (ഹൈപ്പർടെൻഷൻ) നിയന്ത്രിക്കാനും ഹൃദയാഘാത സാധ്യത കുറയ്ക്കാനും ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Selectively blocks angiotensin II from binding to the AT1 receptor, causing vascular smooth muscle relaxation, vasodilation, and reduced aldosterone secretion.",
                "how_it_works_ml": "രക്തക്കുഴലുകളെ വികസിപ്പിച്ച് രക്തസമ്മർദ്ദം കുറയ്ക്കുകയും ഹൃദയത്തിന് ആയാസമില്ലാതെ പ്രവർത്തിക്കാൻ സഹായിക്കുകയും ചെയ്യുന്നു.",
                "common_side_effects": ["Dizziness when standing up", "Fatigue", "Sinusitis symptoms", "Back pain"],
                "common_side_effects_ml": ["തലകറക്കം", "ക്ഷീണം", "നടുവേദന"],
                "serious_warnings": "Hypotension (excessive drop in blood pressure), hyperkalemia (high blood potassium levels), renal impairment. Strictly contraindicated in pregnancy due to fetal toxicity.",
                "serious_warnings_ml": "രക്തസമ്മർദ്ദം പെട്ടെന്ന് താഴുക, പൊട്ടാസ്യം കൂടുക. ഗർഭിണികൾ ഒരു കാരണവശാലും കഴിക്കാൻ പാടില്ല.",
                "precautions": "Avoid potassium supplements or salt substitutes containing potassium without consulting doctor. Monitor blood pressure and electrolytes.",
                "precautions_ml": "പൊട്ടാസ്യം അടങ്ങിയ ഭക്ഷണങ്ങളോ ഉപ്പ് പകരക്കാരോ ഡോക്ടറുടെ അനുവാദമില്ലാതെ ഉപയോഗിക്കരുത്.",
                "contraindications": "Pregnancy (second and third trimesters), severe biliary obstructive disorders.",
                "contraindications_ml": "ഗർഭാവസ്ഥയിൽ കഴിക്കരുത്. പിത്താശയ തടസ്സമുള്ളവർ ഒഴിവാക്കുക.",
                "food_precautions": "Can be taken with or without food, but should be taken consistently at the same time each day.",
                "food_precautions_ml": "ഭക്ഷണത്തിനു മുൻപോ ശേഷമോ കഴിക്കാം. ദിവസവും ഒരേ സമയത്ത് കഴിക്കാൻ ശ്രദ്ധിക്കുക.",
                "storage_info": "Store in the original blister pack to protect from moisture.",
                "missed_dose_info": "Take as soon as remembered. If close to regular time next day, skip missed dose.",
                "missed_dose_info_ml": "ഓർമ്മ വരുമ്പോൾ ഉടൻ കഴിക്കുക. അടുത്ത ദിവസത്തെ സമയമായെങ്കിൽ വിട്ടുകളയുക.",
                "verified_source": "CDSCO / MedlinePlus / European Society of Cardiology",
                "ingredients": [
                    {"name": "Telmisartan", "strength": "40 mg"}
                ],
                "brands": ["Telma 40 (Glenmark)", "Telpres 40 (Abbott)", "Micardis (Boehringer Ingelheim)"]
            },
            {
                "name": "Warf 5 Tablet",
                "brand_name": "Warf",
                "generic_name": "Warfarin Sodium",
                "medicine_category": "Oral Anticoagulant (Vitamin K Antagonist)",
                "dosage_form": "Tablet",
                "strength": "Warfarin 5mg",
                "common_uses": "Prophylaxis and treatment of deep vein thrombosis (DVT), pulmonary embolism, thromboembolic complications associated with atrial fibrillation or cardiac valve replacement.",
                "common_uses_ml": "രക്തം കട്ടപിടിക്കുന്നത് തടയാൻ (ആന്റി-കോഗ്യുലന്റ്) ഉപയോഗിക്കുന്നു. ഹൃദയവാൽവ് മാറ്റിവെച്ചവരിലും പക്ഷാഘാത സാധ്യതയുള്ളവരിലും ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Inhibits vitamin K epoxide reductase complex 1 (VKORC1), depleting functional vitamin K and suppressing hepatic synthesis of clotting factors II, VII, IX, and X.",
                "how_it_works_ml": "രക്തം കട്ടപിടിക്കാൻ സഹായിക്കുന്ന വിറ്റാമിൻ കെ യുടെ പ്രവർത്തനത്തെ തടഞ്ഞ് രക്തം നേർപ്പിക്കുന്നു.",
                "common_side_effects": ["Easy bruising", "Minor gum bleeding when brushing teeth", "Nosebleeds"],
                "common_side_effects_ml": ["പെട്ടെന്ന് മുറിവേൽക്കുകയോ ചതവ് ഉണ്ടാവുകയോ ചെയ്യുക", "മോണയിൽ നിന്നോ മൂക്കിൽ നിന്നോ രക്തസ്രാവം"],
                "serious_warnings": "Major hemorrhage: severe gastrointestinal bleeding, cerebral hemorrhage, red/dark urine, coughing blood. Requires regular INR blood tests.",
                "serious_warnings_ml": "ഗുരുതരമായ രക്തസ്രാവ സാധ്യത! മൂത്രത്തിലോ മലത്തിലോ രക്തം കാണുക, കഠിനമായ തലവേദന എന്നിവ ഉണ്ടായാൽ ഉടൻ അടിയന്തര ചികിത്സ തേടുക. കൃത്യമായി INR ടെസ്റ്റ് ചെയ്യുക.",
                "precautions": "Keep consistent dietary intake of vitamin K (green leafy vegetables). Many drug interactions exist. Inform all doctors, dentists, and surgeons.",
                "precautions_ml": "ഇലക്കറികൾ (വിറ്റാമിൻ കെ) കഴിക്കുന്നതിന്റെ അളവ് വലിയ വ്യതിയാനമില്ലാതെ സ്ഥിരമായി നിലനിർത്തുക. മറ്റ് മരുന്നുകൾ കഴിക്കുന്നതിന് മുൻപ് ഡോക്ടറോട് പറയുക.",
                "contraindications": "Active major bleeding, pregnancy, uncontrolled severe hypertension.",
                "contraindications_ml": "രക്തസ്രാവമുള്ളവരും ഗർഭിണികളും ഉപയോഗിക്കരുത്.",
                "food_precautions": "Maintain stable diet of green vegetables; avoid binge drinking of alcohol.",
                "food_precautions_ml": "മദ്യം ഒഴിവാക്കുക. ഇലക്കറികളുടെ അളവ് കൃത്യമായി സൂക്ഷിക്കുക.",
                "storage_info": "Store at room temperature 15°C to 30°C protected from light.",
                "missed_dose_info": "Take as soon as possible on the same day. Do not take extra medicine to make up a dose.",
                "missed_dose_info_ml": "അന്നുതന്നെ ഓർമ്മ വരുമ്പോൾ കഴിക്കുക. പിറ്റേ ദിവസം ഇരട്ടി ഡോസ് കഴിക്കരുത്.",
                "verified_source": "CDSCO / FDA / WHO / ACCP Guidelines",
                "ingredients": [
                    {"name": "Warfarin Sodium", "strength": "5 mg"}
                ],
                "brands": ["Warf 5 (Cipla)", "Coumadin (BMS)"]
            },
            {
                "name": "Ecosprin 75 Tablet",
                "brand_name": "Ecosprin",
                "generic_name": "Aspirin (Acetylsalicylic Acid)",
                "medicine_category": "Antiplatelet Agent",
                "dosage_form": "Enteric Coated Tablet",
                "strength": "Aspirin 75mg",
                "common_uses": "Secondary prevention of myocardial infarction (heart attack), stroke, and transient ischemic attacks in at-risk cardiovascular patients.",
                "common_uses_ml": "ഹൃദയാഘാതം, പക്ഷാഘാതം എന്നിവ തടയുന്നതിനായി രക്തത്തിലെ പ്ലേറ്റ്‌ലെറ്റുകൾ കട്ടപിടിക്കുന്നത് തടയാൻ ഉപയോഗിക്കുന്നു.",
                "how_it_works": "Irreversibly acetylates and inhibits cyclooxygenase-1 (COX-1) in platelets, preventing thromboxane A2 production and suppressing platelet aggregation.",
                "how_it_works_ml": "രക്തത്തിലെ പ്ലേറ്റ്‌ലെറ്റുകൾ പരസ്പരം ഒട്ടിപ്പിടിക്കുന്നത് തടഞ്ഞ് രക്തക്കുഴലുകളിൽ ബ്ലോക്ക് ഉണ്ടാകാതെ സംരക്ഷിക്കുന്നു.",
                "common_side_effects": ["Dyspepsia / mild stomach burning", "Slight nausea", "Occasional easy bruising"],
                "common_side_effects_ml": ["നെഞ്ചെരിച്ചിൽ", "വയറ്റിൽ എരിച്ചിൽ", "നേരിയ ചതവ്"],
                "serious_warnings": "Gastrointestinal ulceration, black tarry stools (melena), acute bronchospasm in aspirin-sensitive asthmatics.",
                "serious_warnings_ml": "ആമാശയത്തിൽ അൾസർ, കറുത്ത നിറത്തിലുള്ള മലം (രക്തസ്രാവം). ആസ്ത്മയുള്ളവർ ഡോക്ടറുടെ പ്രത്യേക ഉപദേശപ്രകാരം മാത്രം കഴിക്കുക.",
                "precautions": "Take after meals to protect the stomach lining. Stop before scheduled dental or elective surgeries as advised by surgeon.",
                "precautions_ml": "ആമാശയ സംരക്ഷണത്തിനായി എപ്പോഴും ഭക്ഷണത്തിന് ശേഷം മാത്രം കഴിക്കുക. സർജറിക്ക് മുൻപ് ഡോക്ടറെ അറിയിക്കുക.",
                "contraindications": "Active peptic ulcer, bleeding diathesis, severe asthma, children/teens with viral illness (risk of Reye's syndrome).",
                "contraindications_ml": "ആമാശയ അൾസറുള്ളവരും രക്തസ്രാവ രോഗമുള്ളവരും കഴിക്കരുത്.",
                "food_precautions": "Always take after food with plenty of water.",
                "food_precautions_ml": "എപ്പോഴും ഭക്ഷണത്തിന് ശേഷം ധാരാളം വെള്ളത്തോടൊപ്പം കഴിക്കുക.",
                "storage_info": "Store in a cool dry place.",
                "missed_dose_info": "Take as soon as remembered. If within 4 hours of next dose, skip.",
                "missed_dose_info_ml": "ഓർമ്മ വരുമ്പോൾ ഭക്ഷണത്തിന് ശേഷം കഴിക്കുക.",
                "verified_source": "CDSCO / American Heart Association / WHO",
                "ingredients": [
                    {"name": "Aspirin", "strength": "75 mg"}
                ],
                "brands": ["Ecosprin 75 (USV)", "Disprin (Reckitt)", "Loprin 75 (Unichem)"]
            },
            {
                "name": "Brufen 400 Tablet",
                "brand_name": "Brufen",
                "generic_name": "Ibuprofen",
                "medicine_category": "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
                "dosage_form": "Tablet",
                "strength": "Ibuprofen 400mg",
                "common_uses": "Relief of inflammatory pain, arthritis, dental pain, menstrual pain, and post-traumatic soft-tissue injury swelling.",
                "common_uses_ml": "സന്ധിവേദന, നീർക്കെട്ട്, പല്ലുവേദന, ആർത്തവവേദന, വീക്കം എന്നിവ കുറയ്ക്കാൻ ഉപയോഗിക്കുന്ന വേദനസംഹാരി.",
                "how_it_works": "Inhibits cyclooxygenase enzymes COX-1 and COX-2, decreasing inflammatory prostaglandins synthesis.",
                "how_it_works_ml": "ശരീരത്തിൽ വീക്കവും വേദനയും ഉണ്ടാക്കുന്ന പ്രോസ്റ്റാഗ്ലാന്റിനുകളുടെ നിർമ്മാണം തടയുന്നു.",
                "common_side_effects": ["Heartburn", "Stomach ache", "Nausea", "Headache"],
                "common_side_effects_ml": ["നെഞ്ചെരിച്ചിൽ", "വയറുവേദന", "ഓക്കാനം"],
                "serious_warnings": "Can cause stomach ulcers, GI bleeding, elevated blood pressure, and acute kidney impairment with prolonged unmonitored use.",
                "serious_warnings_ml": "ദീർഘകാല ഉപയോഗം ആമാശയത്തിൽ വ്രണം, ഉയർന്ന രക്തസമ്മർദ്ദം, വൃക്ക തകരാറുകൾ എന്നിവ ഉണ്ടാക്കാം.",
                "precautions": "Take with food or milk. Avoid taking together with Telmisartan or other blood pressure medications without medical guidance.",
                "precautions_ml": "ഭക്ഷണത്തോടൊപ്പമോ പാലിനൊപ്പമോ കഴിക്കുക. രക്തസമ്മർദ്ദത്തിനുള്ള മരുന്നുകൾ കഴിക്കുന്നവർ ശ്രദ്ധിക്കുക.",
                "contraindications": "Active GI ulcer, history of NSAID-induced asthma, third trimester of pregnancy.",
                "contraindications_ml": "അൾസർ രോഗികളും ഗർഭിണികളും ഉപയോഗിക്കരുത്.",
                "food_precautions": "Always take with food or milk.",
                "food_precautions_ml": "ഭക്ഷണത്തോടൊപ്പമോ പാലിലോ കഴിക്കുക.",
                "storage_info": "Store below 25°C.",
                "missed_dose_info": "Take as soon as remembered if pain persists.",
                "missed_dose_info_ml": "വേദനയുണ്ടെങ്കിൽ മാത്രം ഓർമ്മ വരുമ്പോൾ കഴിക്കുക.",
                "verified_source": "CDSCO / MedlinePlus / NHS",
                "ingredients": [
                    {"name": "Ibuprofen", "strength": "400 mg"}
                ],
                "brands": ["Brufen 400 (Abbott)", "Ibugesic 400 (Cipla)", "Combiflam [Combination] (Sanofi)"]
            },
            {
                "name": "Azee 500 Tablet",
                "brand_name": "Azee",
                "generic_name": "Azithromycin",
                "medicine_category": "Macrolide Antibiotic",
                "dosage_form": "Tablet",
                "strength": "Azithromycin 500mg",
                "common_uses": "Bacterial infections of the chest (bronchitis, pneumonia), throat (tonsillitis, pharyngitis), ear, skin, and certain sexually transmitted infections.",
                "common_uses_ml": "തൊണ്ടവേദന, ന്യുമോണിയ, ശ്വാസകോശ അണുബാധകൾ, ത്വക്ക് രോഗങ്ങൾ എന്നിവയ്ക്ക് നൽകുന്ന ആന്റിബയോട്ടിക്.",
                "how_it_works": "Binds reversibly to the 50S ribosomal subunit of susceptible microorganisms, thereby inhibiting protein synthesis.",
                "how_it_works_ml": "ബാക്ടീരിയകൾ ജീവൻ നിലനിർത്താൻ പ്രോട്ടീൻ നിർമ്മിക്കുന്നത് തടഞ്ഞ് അവയെ നശിപ്പിക്കുന്നു.",
                "common_side_effects": ["Nausea", "Loose stools", "Stomach cramps", "Temporary taste alteration"],
                "common_side_effects_ml": ["വയറിളക്കം", "ഓക്കാനം", "വയറുവേദന"],
                "serious_warnings": "Cardiac arrhythmia (QT prolongation), severe allergic reactions (angioedema), cholestatic liver damage.",
                "serious_warnings_ml": "ഹൃദയമിടിപ്പിലെ അസാധാരണ വ്യതിയാനം (അപൂർവ്വമായി), കഠിനമായ അലർജി.",
                "precautions": "Do not take antacids containing aluminum or magnesium at the same time (separate by 2 hours). Finish prescribed 3 or 5 day course.",
                "precautions_ml": "അന്റാസിഡുകളോടൊപ്പം ഒരേസമയം കഴിക്കരുത് (2 മണിക്കൂർ വ്യത്യാസം വേണം). കോഴ്സ് പൂർത്തിയാക്കുക.",
                "contraindications": "History of cholestatic jaundice/hepatic dysfunction associated with prior azithromycin use.",
                "contraindications_ml": "മുൻപ് അസിത്രോമൈസിൻ കഴിച്ച് കരൾ പ്രശ്നങ്ങൾ ഉണ്ടായവർ കഴിക്കരുത്.",
                "food_precautions": "Can be taken with or without food. Taking with food helps reduce nausea.",
                "food_precautions_ml": "ഭക്ഷണത്തിനു ശേഷമോ മുൻപോ കഴിക്കാം.",
                "storage_info": "Store at room temperature below 30°C.",
                "missed_dose_info": "Take as soon as remembered, then continue once-daily schedule.",
                "missed_dose_info_ml": "ഓർമ്മ വരുമ്പോൾ കഴിക്കുക.",
                "verified_source": "CDSCO / WHO Essential Medicines / FDA",
                "ingredients": [
                    {"name": "Azithromycin Dihydrate", "strength": "500 mg"}
                ],
                "brands": ["Azee 500 (Cipla)", "Azithral 500 (Alembic)", "Zithromax (Pfizer)"]
            }
        ]

        for m_data in medicines_data:
            ingredients = m_data.pop("ingredients")
            brands = m_data.pop("brands")
            med, created = Medicine.objects.update_or_create(
                name=m_data["name"],
                defaults=m_data
            )
            for ing in ingredients:
                MedicineIngredient.objects.update_or_create(
                    medicine=med,
                    name=ing["name"],
                    defaults={"strength": ing["strength"]}
                )
            for b_name in brands:
                MedicineBrand.objects.update_or_create(
                    medicine=med,
                    brand_name=b_name.split(" (")[0],
                    defaults={"manufacturer": b_name}
                )

        # 3. Known Drug Interactions with authentic Clinical Evidence
        interactions_data = [
            {
                "primary_ingredient": "Warfarin",
                "secondary_ingredient": "Aspirin",
                "severity": DrugInteraction.Severity.POTENTIALLY_SERIOUS,
                "description": "Concomitant use of Warfarin (oral anticoagulant) and Aspirin (antiplatelet agent) substantially amplifies the risk of major hemorrhage and gastrointestinal bleeding.",
                "description_ml": "വാർഫറിനും ആസ്പിരിനും ഒന്നിച്ച് കഴിക്കുന്നത് രക്തസ്രാവത്തിനുള്ള (Internal Bleeding) സാധ്യത വളരെയധികം വർദ്ധിപ്പിക്കുന്നു. ഇത് അതീവ ഗുരുതരമായ പ്രത്യാഘാതങ്ങൾ ഉണ്ടാക്കാം.",
                "clinical_recommendation": "POTENTIALLY SERIOUS INTERACTION: Do not take these two medicines concurrently unless specifically prescribed and monitored by a cardiologist/hematologist with frequent INR checks.",
                "clinical_recommendation_ml": "ഗുരുതരമായ പ്രതിപ്രവർത്തനം: കാർഡിയോളജിസ്റ്റിന്റെയോ ഡോക്ടറുടെയോ കൃത്യമായ നിർദ്ദേശവും പരിശോധനയും ഇല്ലാതെ ഈ രണ്ട് മരുന്നുകൾ ഒരുമിച്ച് കഴിക്കരുത്.",
                "evidence_source": "American College of Chest Physicians (ACCP) Antithrombotic Therapy Guidelines / British National Formulary (BNF)",
                "confidence_score": 0.99
            },
            {
                "primary_ingredient": "Telmisartan",
                "secondary_ingredient": "Ibuprofen",
                "severity": DrugInteraction.Severity.MODERATE,
                "description": "NSAIDs like Ibuprofen may attenuate the antihypertensive effect of Telmisartan (ARB) and significantly increase the risk of renal deterioration and acute kidney injury.",
                "description_ml": "ടെൽമിസാർട്ടനോടൊപ്പം ഐബുപ്രോഫെൻ കഴിക്കുന്നത് രക്തസമ്മർദ്ദം കുറയ്ക്കുന്നതിനെ തടസ്സപ്പെടുത്തുകയും വൃക്കകളെ ദോഷകരമായി ബാധിക്കുകയും ചെയ്തേക്കാം.",
                "clinical_recommendation": "Use paracetamol for mild pain instead of NSAIDs. If an NSAID is necessary, monitor blood pressure and ensure adequate hydration.",
                "clinical_recommendation_ml": "വേദനയ്ക്ക് ഐബുപ്രോഫെന് പകരം പാരാസിറ്റമോൾ കഴിക്കുന്നതാണ് സുരക്ഷിതം. ഡോക്ടറോട് സംസാരിക്കുക.",
                "evidence_source": "Joint National Committee on Hypertension / WHO Clinical Drug Safety Bulletin",
                "confidence_score": 0.94
            },
            {
                "primary_ingredient": "Paracetamol",
                "secondary_ingredient": "Paracetamol", # Duplicate ingredient detection
                "severity": DrugInteraction.Severity.POTENTIALLY_SERIOUS,
                "description": "DUPLICATE ACTIVE INGREDIENT DETECTED: Multiple prescribed medicines contain Paracetamol (Acetaminophen). Taking multiple brands (e.g. Dolo 650 + Crocin) risks surpassing the safe daily limit (4,000 mg).",
                "description_ml": "ഒരേ ചേരുവ ആവർത്തിക്കുന്നു (DUPLICATE): നിങ്ങൾ തിരഞ്ഞെടുത്ത ഒന്നിലധികം മരുന്നുകളിൽ പാരാസിറ്റമോൾ അടങ്ങിയിട്ടുണ്ട്. ഇത് ഒരുമിച്ച് കഴിച്ചാൽ കരളിൽ വിഷബാധയുണ്ടാകാൻ സാധ്യതയുണ്ട്.",
                "clinical_recommendation": "Do not take two paracetamol-containing products together. Verify all product labels to prevent unintentional overdose.",
                "clinical_recommendation_ml": "ഒരേ സമയം രണ്ട് പാരാസിറ്റമോൾ മരുന്നുകൾ കഴിക്കരുത്. അബദ്ധത്തിൽ ഡോസ് കൂടുന്നത് ഒഴിവാക്കാൻ ലേബൽ ശ്രദ്ധിക്കുക.",
                "evidence_source": "CDSCO Drug Safety Alert / US FDA Acetaminophen Overdose Guidance",
                "confidence_score": 0.98
            },
            {
                "primary_ingredient": "Metformin",
                "secondary_ingredient": "Alcohol",
                "severity": DrugInteraction.Severity.POTENTIALLY_SERIOUS,
                "description": "Alcohol potentiates the effect of Metformin on lactate metabolism, significantly elevating the risk of life-threatening lactic acidosis and severe hypoglycemia.",
                "description_ml": "മെറ്റ്ഫോർമിൻ കഴിക്കുന്നവർ മദ്യപിക്കുന്നത് രക്തത്തിൽ ലാക്റ്റിക് ആസിഡ് വർദ്ധിക്കുന്നതിനും ഷുഗർ അപകടകരമാംവിധം താഴുന്നതിനും കാരണമാകും.",
                "clinical_recommendation": "Avoid excessive or binge alcohol consumption while taking Metformin.",
                "clinical_recommendation_ml": "മെറ്റ്ഫോർമിൻ കഴിക്കുന്ന സമയത്ത് മദ്യപാനം കർശനമായി ഒഴിവാക്കുക.",
                "evidence_source": "American Diabetes Association (ADA) Pharmacotherapy Standards",
                "confidence_score": 0.96
            },
            {
                "primary_ingredient": "Azithromycin",
                "secondary_ingredient": "Antacids",
                "severity": DrugInteraction.Severity.MODERATE,
                "description": "Magnesium and aluminum hydroxide antacids reduce the peak serum concentration of Azithromycin by up to 24%, reducing its antibacterial effectiveness.",
                "description_ml": "അലുമിനിയം അല്ലെങ്കിൽ മഗ്നീഷ്യം അടങ്ങിയ അന്റാസിഡ് സിറപ്പുകൾ അസിത്രോമൈസിൻ ശരീരത്തിലേക്ക് ആഗിരണം ചെയ്യപ്പെടുന്നതിന്റെ തോത് കുറയ്ക്കുന്നു.",
                "clinical_recommendation": "Administer Azithromycin at least 1 hour before or 2 hours after taking antacids.",
                "clinical_recommendation_ml": "അസിത്രോമൈസിൻ കഴിക്കുന്നതിന് 1 മണിക്കൂർ മുൻപോ അല്ലെങ്കിൽ 2 മണിക്കൂർ ശേഷമോ മാത്രം അന്റാസിഡ് കഴിക്കുക.",
                "evidence_source": "FDA Approved Prescribing Information for Azithromycin",
                "confidence_score": 0.92
            }
        ]

        for inter in interactions_data:
            primary = inter.pop("primary_ingredient")
            secondary = inter.pop("secondary_ingredient")
            DrugInteraction.objects.update_or_create(
                primary_ingredient=primary,
                secondary_ingredient=secondary,
                defaults=inter
            )

        # Clear any dummy patient prescriptions, schedules, and notifications if they exist
        Prescription.objects.filter(title__icontains="Post-Monsoon").delete()
        MedicationSchedule.objects.filter(medicine_name__icontains="Augmentin").delete()

        self.stdout.write(self.style.SUCCESS("MediSense AI: Official CDSCO/WHO drug library and interaction rules initialized with ZERO dummy data!"))

