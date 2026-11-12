from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import (
    RegisterView, CustomTokenObtainPairView, CurrentUserProfileView,
    NotificationListView, MarkNotificationReadView, AdminDashboardStatsView,
    AdminUserManagementViewSet, AdminVerificationViewSet, ConsentManagementView,
    AIConfigurationView, AITestView
)

router = DefaultRouter()
router.register(r"admin/users", AdminUserManagementViewSet, basename="admin-users")
router.register(r"admin/verifications", AdminVerificationViewSet, basename="admin-verifications")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/profile/", CurrentUserProfileView.as_view(), name="user-profile"),
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/read/", MarkNotificationReadView.as_view(), name="notifications-read-all"),
    path("notifications/<uuid:pk>/read/", MarkNotificationReadView.as_view(), name="notifications-read-one"),
    path("consents/", ConsentManagementView.as_view(), name="consent-records"),
    path("admin/stats/", AdminDashboardStatsView.as_view(), name="admin-stats"),
    path("ai/config/", AIConfigurationView.as_view(), name="ai-config"),
    path("ai/test/", AITestView.as_view(), name="ai-test"),
    path("", include(router.urls)),
]

