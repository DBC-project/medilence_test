from django.urls import path, include
from rest_framework.routers import DefaultRouter
from assistant.views import AIConversationViewSet, AssistantChatView

router = DefaultRouter()
router.register(r"assistant/conversations", AIConversationViewSet, basename="assistant-conversations")

urlpatterns = [
    path("assistant/chat/", AssistantChatView.as_view(), name="assistant-chat"),
    path("", include(router.urls)),
]

