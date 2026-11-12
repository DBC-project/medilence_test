"""
MediSense AI - Prescription Educational Report Generator
Generates clean web report structure and downloadable ReportLab PDF
with mandatory clinical disclaimers.
"""

import io
import os
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from prescriptions.models import Prescription, GeneratedReport
from medicines.models import DrugInteraction

DISCLAIMER_EN = (
    "EDUCATIONAL NOTICE: MediSense AI provides AI-assisted medical information to help patients understand "
    "their doctor's prescription. It is NOT a diagnostic tool and does NOT provide medical advice, alter doses, "
    "or substitute for the judgment of a licensed healthcare professional. Always consult your prescribing physician "
    "or a registered pharmacist before initiating, stopping, or altering any medication."
)

DISCLAIMER_ML = (
    "വിദ്യാഭ്യാസപരമായ അറിയിപ്പ്: ഡോക്ടറുടെ കുറിപ്പടി രോഗികൾക്ക് എളുപ്പത്തിൽ മനസ്സിലാക്കാൻ സഹായിക്കുന്നതിനായുള്ള "
    "AI അധിഷ്ഠിത പ്ലാറ്റ്‌ഫോമാണ് മെഡിസെൻസ് AI. ഇത് ഡോക്ടറുടെ ഉപദേശത്തിനോ നേരിട്ടുള്ള പരിശോധനയ്ക്കോ പകരമാവില്ല. "
    "മരുന്നുകൾ കഴിക്കുന്നതിന് മുൻപ് നിർബന്ധമായും ഡോക്ടറോടോ ഫാർമസിസ്റ്റിനോടോ സംസാരിക്കുക."
)

def build_report_data(prescription: Prescription, language: str = "en") -> dict:
    """Builds the comprehensive educational report data dictionary."""
    patient = prescription.user
    profile = getattr(patient, "patient_profile", None)
    
    medicines = prescription.medicines.all()
    
    # Check potential interactions and duplicate ingredients
    active_ingredients = []
    for m in medicines:
        if m.generic_name:
            active_ingredients.append(m.generic_name)
        elif m.active_ingredient:
            active_ingredients.append(m.active_ingredient)
            
    # Check duplicates
    duplicate_ingredients = []
    seen = {}
    for ing in active_ingredients:
        lower_ing = ing.lower()
        if lower_ing in seen:
            duplicate_ingredients.append(ing)
        else:
            seen[lower_ing] = 1

    # Check interactions in DB
    interactions_found = []
    for i, ing1 in enumerate(active_ingredients):
        for j, ing2 in enumerate(active_ingredients):
            if i >= j:
                continue
            matches = DrugInteraction.objects.filter(
                primary_ingredient__icontains=ing1,
                secondary_ingredient__icontains=ing2
            ) | DrugInteraction.objects.filter(
                primary_ingredient__icontains=ing2,
                secondary_ingredient__icontains=ing1
            )
            for match in matches:
                interactions_found.append({
                    "primary": match.primary_ingredient,
                    "secondary": match.secondary_ingredient,
                    "severity": match.severity,
                    "description": match.description_ml if language == "ml" and match.description_ml else match.description,
                    "recommendation": match.clinical_recommendation_ml if language == "ml" and match.clinical_recommendation_ml else match.clinical_recommendation,
                    "source": match.evidence_source,
                })

    medicine_list = []
    for m in medicines:
        db_med = m.matched_medicine
        medicine_list.append({
            "name": m.medicine_name,
            "brand": m.brand_name,
            "generic": m.generic_name,
            "strength": m.strength,
            "dosage": m.prescribed_dose,
            "frequency": m.frequency,
            "duration": m.duration,
            "route": m.route_of_administration,
            "instructions": m.special_instructions,
            "confidence_score": m.confidence_score,
            "is_uncertain": m.ocr_uncertainty,
            "uncertainty_reason": m.uncertainty_reason,
            "category": db_med.medicine_category if db_med else "Uncategorized",
            "common_uses": (db_med.common_uses_ml if language == "ml" and db_med.common_uses_ml else db_med.common_uses) if db_med else "Consult your physician",
            "how_it_works": (db_med.how_it_works_ml if language == "ml" and db_med.how_it_works_ml else db_med.how_it_works) if db_med else "",
            "common_side_effects": (db_med.common_side_effects_ml if language == "ml" and db_med.common_side_effects_ml else db_med.common_side_effects) if db_med else [],
            "warnings": (db_med.serious_warnings_ml if language == "ml" and db_med.serious_warnings_ml else db_med.serious_warnings) if db_med else "",
            "precautions": (db_med.precautions_ml if language == "ml" and db_med.precautions_ml else db_med.precautions) if db_med else "",
            "verified_source": db_med.verified_source if db_med else "Patient Prescription",
            "last_verified": str(db_med.last_verified_date) if db_med else "",
        })

    disclaimer = DISCLAIMER_ML if language == "ml" else DISCLAIMER_EN

    report_data = {
        "report_id": str(prescription.id),
        "language": language,
        "title": f"MediSense Prescription Intelligence: {prescription.title}",
        "disclaimer": disclaimer,
        "patient": {
            "name": patient.full_name,
            "email": patient.email,
            "blood_group": profile.blood_group if profile else "N/A",
            "allergies": profile.allergies if profile else [],
            "chronic_conditions": profile.chronic_conditions if profile else [],
        },
        "prescription": {
            "title": prescription.title,
            "doctor": prescription.doctor_name or "Not Specified",
            "clinic": prescription.clinic_name or "Not Specified",
            "date": str(prescription.prescription_date or prescription.created_at.date()),
            "status": prescription.status,
            "reviewed_by_doctor": prescription.reviewed_by.full_name if prescription.reviewed_by else None,
            "doctor_notes": prescription.doctor_review_notes or None,
        },
        "medicines": medicine_list,
        "duplicate_ingredients": duplicate_ingredients,
        "interactions": interactions_found,
        "uncertainties_detected": [m for m in medicine_list if m["is_uncertain"]],
    }
    return report_data

def generate_pdf_report(report_data: dict) -> bytes:
    """Generates a professional healthcare PDF report using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#0D9488") # Medical Teal
    dark_text = colors.HexColor("#0F172A")
    light_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#CBD5E1")
    alert_color = colors.HexColor("#DC2626")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=primary_color,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=12,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=dark_text,
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=dark_text,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569"),
    )

    story = []

    # Header
    story.append(Paragraph("MediSense AI - Prescription Intelligence Report", title_style))
    story.append(Paragraph("AI-Assisted Educational Prescription Analysis & Medication Safety Profile", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=12))

    # Patient & Prescription Overview Table
    p = report_data["patient"]
    rx = report_data["prescription"]
    overview_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {p['name']}", body_style),
            Paragraph(f"<b>Prescribing Doctor:</b> {rx['doctor']}", body_style)
        ],
        [
            Paragraph(f"<b>Blood Group:</b> {p['blood_group']}", body_style),
            Paragraph(f"<b>Clinic / Facility:</b> {rx['clinic']}", body_style)
        ],
        [
            Paragraph(f"<b>Known Allergies:</b> {', '.join(p['allergies']) if p['allergies'] else 'None reported'}", body_style),
            Paragraph(f"<b>Prescription Date:</b> {rx['date']}", body_style)
        ],
    ]
    overview_table = Table(overview_data, colWidths=[270, 270])
    overview_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), light_bg),
        ("BOX", (0, 0), (-1, -1), 0.5, border_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 14))

    # Identified Medicines
    story.append(Paragraph("1. Prescribed Medicines & Instructions", section_heading))
    med_table_data = [
        [
            Paragraph("<b>Medicine</b>", body_style),
            Paragraph("<b>Dosage & Route</b>", body_style),
            Paragraph("<b>Frequency</b>", body_style),
            Paragraph("<b>Duration</b>", body_style),
            Paragraph("<b>Instructions</b>", body_style),
        ]
    ]

    for med in report_data["medicines"]:
        uncertain_flag = " <font color='#DC2626'>[Uncertain Handwriting]</font>" if med["is_uncertain"] else ""
        med_table_data.append([
            Paragraph(f"<b>{med['name']}</b>{uncertain_flag}<br/><font color='#64748B'>{med['generic']}</font>", body_style),
            Paragraph(f"{med['dosage']} ({med['route']})", body_style),
            Paragraph(f"{med['frequency']}", body_style),
            Paragraph(f"{med['duration']}", body_style),
            Paragraph(f"{med['instructions']}", body_style),
        ])

    med_table = Table(med_table_data, colWidths=[150, 95, 105, 70, 120])
    med_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E0F2FE")),
        ("BOX", (0, 0), (-1, -1), 0.5, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(med_table)
    story.append(Spacer(1, 14))

    # Educational Insights for Each Medicine
    story.append(Paragraph("2. Educational Medicine Intelligence & Clinical Information", section_heading))
    for med in report_data["medicines"]:
        med_block = [
            Paragraph(f"<b>{med['name']}</b> ({med['category']})", ParagraphStyle("MedTitle", parent=body_style, fontName="Helvetica-Bold", textColor=primary_color)),
            Paragraph(f"<b>Why commonly prescribed:</b> {med['common_uses']}", body_style),
            Paragraph(f"<b>Common side effects:</b> {', '.join(med['common_side_effects']) if med['common_side_effects'] else 'Generally well-tolerated'}", body_style),
        ]
        if med["warnings"]:
            med_block.append(Paragraph(f"<b>Important Precautions:</b> {med['warnings']}", body_style))
        if med["is_uncertain"]:
            med_block.append(Paragraph(f"<b><font color='#DC2626'>Attention:</font></b> {med['uncertainty_reason']}", body_style))

        med_block.append(Paragraph(f"<font color='#64748B'>Source: {med['verified_source']}</font>", disclaimer_style))
        med_block.append(Spacer(1, 8))
        story.append(KeepTogether(med_block))

    # Interactions & Safety Alerts
    if report_data["interactions"] or report_data["duplicate_ingredients"]:
        story.append(Paragraph("3. Safety Alerts & Drug Interaction Findings", section_heading))
        for inter in report_data["interactions"]:
            story.append(Paragraph(
                f"<b>Warning: Potential Interaction ({inter['primary']} + {inter['secondary']})</b><br/>"
                f"{inter['description']}<br/>"
                f"<b>Recommendation:</b> {inter['recommendation']}<br/>"
                f"<font color='#64748B'>Evidence: {inter['source']}</font>",
                body_style
            ))
            story.append(Spacer(1, 6))

        for dup in report_data["duplicate_ingredients"]:
            story.append(Paragraph(
                f"<b><font color='#DC2626'>Duplicate Active Ingredient Alert: {dup}</font></b><br/>"
                f"Multiple prescribed items contain this same active ingredient. Confirm total daily dose with your doctor or pharmacist.",
                body_style
            ))
            story.append(Spacer(1, 6))

    # Doctor Verification Section if reviewed
    if rx["reviewed_by_doctor"]:
        story.append(Paragraph("4. Medical Professional Verification", section_heading))
        story.append(Paragraph(
            f"<b>Reviewed by:</b> {rx['reviewed_by_doctor']}<br/>"
            f"<b>Doctor Notes:</b> {rx['doctor_notes']}",
            body_style
        ))
        story.append(Spacer(1, 10))

    # Mandatory Legal / Educational Disclaimer Box
    story.append(Spacer(1, 10))
    disclaimer_box = [
        [Paragraph(f"<b>IMPORTANT EDUCATIONAL NOTICE:</b><br/>{report_data['disclaimer']}", disclaimer_style)]
    ]
    disc_table = Table(disclaimer_box, colWidths=[540])
    disc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(disc_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

