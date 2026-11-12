from rest_framework import serializers
from assistant.models import AIConversation, AIMessage

class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "sender", "message", "citations", "is_emergency_flagged", "timestamp"]

class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = ["id", "title", "prescription", "language", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at"]

class AssistantChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    prescription_id = serializers.UUIDField(required=False, allow_null=True)
    language = serializers.CharField(default="en")

