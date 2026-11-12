from django.urls import path, include
from rest_framework.routers import DefaultRouter
from medicines.views import MedicineViewSet, MedicineLookupView, DrugInteractionCheckView

router = DefaultRouter()
router.register(r"medicines", MedicineViewSet, basename="medicines")

urlpatterns = [
    path("medicines/lookup/", MedicineLookupView.as_view(), name="medicine-lookup"),
    path("interactions/check/", DrugInteractionCheckView.as_view(), name="interactions-check"),
    path("", include(router.urls)),
]

