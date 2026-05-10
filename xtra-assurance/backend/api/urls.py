from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('policies', views.PolicyViewSet, basename='policy')
router.register('claims', views.ClaimViewSet, basename='claim')
router.register('risk-zones', views.RiskZoneViewSet, basename='riskzone')
router.register('referrals', views.ReferralViewSet, basename='referral')
router.register('notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/me/', views.me, name='me'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('wallet/', views.wallet, name='wallet'),
    path('', include(router.urls)),
]
