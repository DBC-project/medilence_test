import os
from django.conf import settings
from django.core.files.base import ContentFile
from django.http import HttpResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from prescriptions.models import Prescription, PrescriptionPage, PrescriptionMedicine, GeneratedReport
from prescriptions.serializers import PrescriptionSerializer, PrescriptionMedicineSerializer, GeneratedReportSerializer
from prescriptions.ocr_service import (
    preprocess_prescription_image, extract_text_from_pdf, parse_prescription_text,
    extract_text_with_open_source_ocr, parse_medical_scan_data
)
from prescriptions.report_generator import build_report_data, generate_pdf_report
from medicines.models import Medicine
from core.models import User, AuditLog, Notification

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return Prescription.objects.all()
        elif user.role == User.Role.PROFESSIONAL:
            # Doctors see prescriptions explicitly shared with them or already reviewed by them
            return Prescription.objects.filter(is_shared_with_doctor=True)
        return Prescription.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PrescriptionUploadAndAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size
        max_size = getattr(settings, "MAX_UPLOAD_SIZE_MB", 15) * 1024 * 1024
        if uploaded_file.size > max_size:
            return Response(
                {"error": f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate format
        file_ext = os.path.splitext(uploaded_file.name)[1].lower()
        allowed_exts = [".jpg", ".jpeg", ".png", ".pdf"]
        if file_ext not in allowed_exts:
            return Response(
                {"error": "Unsupported file format. Please upload JPG, PNG, or PDF."},
                status=status.HTTP_400_BAD_REQUEST
            )

        scan_category = request.data.get("scan_category", "PRESCRIPTION")
        title = request.data.get("title", f"{'Medicine Product' if scan_category == 'PRODUCT_PACK' else 'Prescription'} - {uploaded_file.name}")
        doctor_name = request.data.get("doctor_name", "")
        clinic_name = request.data.get("clinic_name", "")

        # Create Prescription record
        rx = Prescription.objects.create(
            user=request.user,
            title=title,
            scan_category=scan_category,
            doctor_name=doctor_name,
            clinic_name=clinic_name,
            original_file=uploaded_file,
            file_type=uploaded_file.content_type or file_ext,
            status=Prescription.Status.PROCESSING,
        )

        # Execute Open-Source AI Vision & Clinical Extraction
        file_path = rx.original_file.path
        raw_text = ""
        extracted_items = []
        ocr_lines = []

        if file_ext in [".jpg", ".jpeg", ".png"]:
            # 1. Run free Open-Source Neural Vision OCR (RapidOCR + OpenCV) on device
            ocr_lines, boxes, ocr_full_text = extract_text_with_open_source_ocr(file_path)
            raw_text = ocr_full_text

            # Create processed page record
            processed_path = preprocess_prescription_image(file_path)
            PrescriptionPage.objects.create(
                prescription=rx,
                page_number=1,
                page_image=rx.original_file,
            )

            # 2. Optional external multimodal vision augmentation if API key is configured
            from assistant.ai_service import query_gemini_vision
            vision_items = query_gemini_vision(file_path, scan_type=scan_category)
            if vision_items:
                for v_item in vision_items:
                    med_name = v_item.get("medicine_name", "")
                    matched_med = Medicine.objects.filter(name__icontains=med_name).first() or \
                                 Medicine.objects.filter(generic_name__icontains=v_item.get("generic_name", "")).first()
                    extracted_items.append({
                        "matched_medicine": matched_med,
                        "medicine_name": med_name,
                        "brand_name": v_item.get("brand_name", matched_med.brand_name if matched_med else ""),
                        "manufacturer": v_item.get("manufacturer", ""),
                        "generic_name": v_item.get("generic_name", matched_med.generic_name if matched_med else ""),
                        "active_ingredient": v_item.get("generic_name", ""),
                        "strength": v_item.get("strength", ""),
                        "dosage_form": v_item.get("dosage_form", "Tablet"),
                        "prescribed_dose": v_item.get("prescribed_dose", "1 Tablet"),
                        "frequency": v_item.get("frequency", "As directed"),
                        "duration": v_item.get("duration", "As prescribed"),
                        "route_of_administration": v_item.get("route_of_administration", "Oral"),
                        "special_instructions": v_item.get("special_instructions", ""),
                        "confidence_score": float(v_item.get("confidence_score", 0.95)),
                        "ocr_uncertainty": bool(v_item.get("ocr_uncertainty", False)),
                        "uncertainty_reason": v_item.get("uncertainty_reason", ""),
                        "source_text": f"{med_name} {v_item.get('prescribed_dose', '')} {v_item.get('frequency', '')}",
                    })
        elif file_ext == ".pdf":
            raw_text = extract_text_from_pdf(file_path)
            ocr_lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

        user_notes = request.data.get("raw_text", "").strip()
        if user_notes:
            raw_text = f"{raw_text}\n{user_notes}".strip()
            ocr_lines.extend([l.strip() for l in user_notes.splitlines() if l.strip()])

        # If vision items were not provided via external API, use our Open-Source AI Clinical Parser
        if not extracted_items and (raw_text.strip() or ocr_lines):
            extracted_items = parse_medical_scan_data(raw_text, scan_category=scan_category, ocr_lines=ocr_lines)

        has_uncertainty = False
        if not extracted_items:
            has_uncertainty = True
            rx.uncertainty_warning = "No readable prescription text detected. Please ensure the image is clear and in focus, or enter details manually."
        for item in extracted_items:
            is_un = item["ocr_uncertainty"]
            if is_un:
                has_uncertainty = True

            PrescriptionMedicine.objects.create(
                prescription=rx,
                matched_medicine=item["matched_medicine"],
                medicine_name=item["medicine_name"],
                brand_name=item["brand_name"],
                manufacturer=item.get("manufacturer", ""),
                generic_name=item["generic_name"],
                active_ingredient=item["active_ingredient"],
                strength=item["strength"],
                dosage_form=item["dosage_form"],
                prescribed_dose=item["prescribed_dose"],
                frequency=item["frequency"],
                duration=item["duration"],
                route_of_administration=item["route_of_administration"],
                special_instructions=item["special_instructions"],
                confidence_score=item["confidence_score"],
                ocr_uncertainty=is_un,
                uncertainty_reason=item["uncertainty_reason"],
                source_text=item["source_text"],
            )

        rx.has_unclear_handwriting = has_uncertainty
        if has_uncertainty:
            rx.uncertainty_warning = "One or more medicine names or instructions were uncertain from the prescription handwriting. Please review and confirm below."
        else:
            rx.uncertainty_warning = ""
        rx.raw_extracted_text = raw_text
        rx.status = Prescription.Status.EXTRACTED
        rx.save()

        # Audit log
        AuditLog.objects.create(
            user=request.user,
            action="PRESCRIPTION_UPLOAD_ANALYSIS",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            details={"prescription_id": str(rx.id), "items_extracted": len(extracted_items)}
        )

        return Response(PrescriptionSerializer(rx).data, status=status.HTTP_201_CREATED)

class PrescriptionConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            rx = Prescription.objects.get(id=pk, user=request.user)
        except Prescription.DoesNotExist:
            raise Http404

        medicines_data = request.data.get("medicines", [])
        from medicines.models import Medicine
        from django.db.models import Q

        # Track existing IDs to handle deletions if requested
        submitted_ids = []

        for m_data in medicines_data:
            med_name = m_data.get("medicine_name", "").strip()
            if not med_name:
                continue

            med_id = m_data.get("id")
            med_obj = None

            if med_id and not str(med_id).startswith("manual"):
                try:
                    med_obj = PrescriptionMedicine.objects.get(id=med_id, prescription=rx)
                except Exception:
                    med_obj = None

            matched = Medicine.objects.filter(
                Q(name__icontains=med_name) | Q(generic_name__icontains=med_name) | Q(brand_name__icontains=med_name)
            ).first()

            if med_obj:
                med_obj.medicine_name = med_name
                med_obj.matched_medicine = matched
                med_obj.brand_name = m_data.get("brand_name", matched.brand_name if matched else med_obj.brand_name)
                med_obj.generic_name = m_data.get("generic_name", matched.generic_name if matched else med_obj.generic_name)
                med_obj.strength = m_data.get("strength", med_obj.strength)
                med_obj.dosage_form = m_data.get("dosage_form", med_obj.dosage_form)
                med_obj.prescribed_dose = m_data.get("prescribed_dose", med_obj.prescribed_dose)
                med_obj.frequency = m_data.get("frequency", med_obj.frequency)
                med_obj.duration = m_data.get("duration", med_obj.duration)
                med_obj.special_instructions = m_data.get("special_instructions", med_obj.special_instructions)
                med_obj.user_confirmed = True
                med_obj.user_edited = True
                med_obj.ocr_uncertainty = False # Confirmed by user
                med_obj.save()
                submitted_ids.append(med_obj.id)
            else:
                new_item = PrescriptionMedicine.objects.create(
                    prescription=rx,
                    matched_medicine=matched,
                    medicine_name=med_name,
                    brand_name=m_data.get("brand_name", matched.brand_name if matched else ""),
                    generic_name=m_data.get("generic_name", matched.generic_name if matched else ""),
                    strength=m_data.get("strength", matched.strength if matched else ""),
                    dosage_form=m_data.get("dosage_form", "Tablet"),
                    prescribed_dose=m_data.get("prescribed_dose", "1 Tablet"),
                    frequency=m_data.get("frequency", "Once daily (OD)"),
                    duration=m_data.get("duration", "5 days"),
                    route_of_administration=m_data.get("route_of_administration", "Oral"),
                    special_instructions=m_data.get("special_instructions", "Take after food with water"),
                    confidence_score=1.0,
                    ocr_uncertainty=False,
                    user_confirmed=True,
                    user_edited=True,
                )
                submitted_ids.append(new_item.id)

        # Remove medicines that were deleted by user during confirmation
        if submitted_ids:
            rx.medicines.exclude(id__in=submitted_ids).delete()
            rx.has_unclear_handwriting = False

        rx.status = Prescription.Status.CONFIRMED
        rx.save()

        return Response(PrescriptionSerializer(rx).data)

class DoctorReviewPrescriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role != User.Role.PROFESSIONAL and not user.is_staff:
            return Response({"error": "Only registered medical professionals can submit prescription reviews."}, status=status.HTTP_403_FORBIDDEN)

        try:
            rx = Prescription.objects.get(id=pk)
        except Prescription.DoesNotExist:
            raise Http404

        notes = request.data.get("doctor_review_notes", "").strip()
        rx.doctor_review_notes = notes
        rx.reviewed_by = user
        rx.status = Prescription.Status.REVIEWED
        rx.save()

        # Notify patient
        Notification.objects.create(
            user=rx.user,
            title="Prescription Reviewed by Doctor",
            message=f"Dr. {user.full_name} has verified your prescription '{rx.title}' and left clinical notes.",
            notification_type=Notification.Type.REVIEW_NOTE,
            link=f"/prescriptions/{rx.id}"
        )

        return Response(PrescriptionSerializer(rx).data)

class GenerateReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            rx = Prescription.objects.get(id=pk, user=request.user)
        except Prescription.DoesNotExist:
            raise Http404

        language = request.data.get("language", "en")
        report_data = build_report_data(rx, language=language)

        # Generate PDF
        pdf_bytes = generate_pdf_report(report_data)

        report = GeneratedReport.objects.create(
            prescription=rx,
            language=language,
            summary_content=report_data,
        )
        report.pdf_file.save(f"report_{rx.id}_{language}.pdf", ContentFile(pdf_bytes), save=True)

        return Response(GeneratedReportSerializer(report).data, status=status.HTTP_201_CREATED)

class DownloadReportPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            report = GeneratedReport.objects.select_related("prescription").get(id=pk)
            # Verify authorization
            if report.prescription.user != request.user and request.user.role != User.Role.ADMIN:
                return Response({"error": "Unauthorized access to report."}, status=status.HTTP_403_FORBIDDEN)
        except GeneratedReport.DoesNotExist:
            raise Http404

        if not report.pdf_file:
            pdf_bytes = generate_pdf_report(report.summary_content)
            report.pdf_file.save(f"report_{report.id}.pdf", ContentFile(pdf_bytes), save=True)

        response = HttpResponse(report.pdf_file.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="MediSense_Report_{report.id}.pdf"'
        return response
