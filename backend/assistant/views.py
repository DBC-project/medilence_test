from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from assistant.models import AIConversation, AIMessage
from assistant.serializers import AIConversationSerializer, AIMessageSerializer, AssistantChatRequestSerializer
from assistant.ai_service import process_assistant_query
from prescriptions.models import Prescription

class AIConversationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user).prefetch_related("messages")

class AssistantChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AssistantChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message_text = serializer.validated_data["message"]
        conv_id = serializer.validated_data.get("conversation_id")
        prescription_id = serializer.validated_data.get("prescription_id")
        language = serializer.validated_data.get("language", request.user.language_preference or "en")

        # Get or create conversation
        conversation = None
        if conv_id:
            try:
                conversation = AIConversation.objects.get(id=conv_id, user=request.user)
            except AIConversation.DoesNotExist:
                conversation = None

        if not conversation:
            rx = None
            if prescription_id:
                try:
                    rx = Prescription.objects.get(id=prescription_id, user=request.user)
                except Prescription.DoesNotExist:
                    rx = None
            
            title = user_message_text[:40] + ("..." if len(user_message_text) > 40 else "")
            conversation = AIConversation.objects.create(
                user=request.user,
                title=title,
                prescription=rx,
                language=language
            )

        # Record User Message
        AIMessage.objects.create(
            conversation=conversation,
            sender=AIMessage.Sender.USER,
            message=user_message_text
        )

        # Process through AI pipeline
        ai_result = process_assistant_query(
            query=user_message_text,
            language=language,
            prescription_id=str(conversation.prescription.id) if conversation.prescription else None
        )

        # Record Assistant Message
        assistant_msg = AIMessage.objects.create(
            conversation=conversation,
            sender=AIMessage.Sender.ASSISTANT,
            message=ai_result["message"],
            citations=ai_result["citations"],
            is_emergency_flagged=ai_result["is_emergency"],
        )

        return Response({
            "conversation_id": str(conversation.id),
            "message": AIMessageSerializer(assistant_msg).data,
            "citations": ai_result["citations"],
            "is_emergency_flagged": ai_result["is_emergency"],
        }, status=status.HTTP_200_OK)
