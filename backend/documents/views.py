from rest_framework import viewsets, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from documents.models import MedicalDocument, SharedMedicalRecord
from documents.serializers import MedicalDocumentSerializer, SharedMedicalRecordSerializer
from core.models import User, AuditLog, Notification

class MedicalDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "category", "tags"]
    ordering_fields = ["document_date", "created_at", "title"]

    def get_queryset(self):
        user = self.request.user
        category = self.request.query_params.get("category")
        qs = MedicalDocument.objects.filter(user=user)
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        doc_file = self.request.FILES.get("document_file")
        size = doc_file.size if doc_file else 0
        file_type = doc_file.content_type if doc_file else ""
        doc = serializer.save(
            user=self.request.user,
            file_size_bytes=size,
            file_type=file_type,
        )

        AuditLog.objects.create(
            user=self.request.user,
            action="VAULT_DOCUMENT_UPLOAD",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
            details={"document_id": str(doc.id), "title": doc.title, "category": doc.category}
        )

class ShareMedicalRecordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        patient = request.user
        professional_id = request.data.get("professional_id")
        document_id = request.data.get("document_id")
        prescription_id = request.data.get("prescription_id")

        try:
            doctor = User.objects.get(id=professional_id, role=User.Role.PROFESSIONAL)
        except User.DoesNotExist:
            return Response({"error": "Medical professional not found."}, status=status.HTTP_404_NOT_FOUND)

        share = SharedMedicalRecord.objects.create(
            patient=patient,
            professional=doctor,
            document_id=document_id,
            prescription_id=prescription_id,
        )

        Notification.objects.create(
            user=doctor,
            title="New Medical Record Shared for Review",
            message=f"Patient {patient.full_name} has shared a medical record for your professional consultation.",
            notification_type=Notification.Type.REVIEW_NOTE,
        )

        return Response(SharedMedicalRecordSerializer(share).data, status=status.HTTP_201_CREATED)

class SharedRecordsWithMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.PROFESSIONAL and not request.user.is_staff:
            return Response({"error": "Only verified professionals can view shared records."}, status=status.HTTP_403_FORBIDDEN)

        records = SharedMedicalRecord.objects.filter(
            professional=request.user,
            is_revoked=False
        ).select_related("patient", "document", "prescription")
        return Response(SharedMedicalRecordSerializer(records, many=True).data)
