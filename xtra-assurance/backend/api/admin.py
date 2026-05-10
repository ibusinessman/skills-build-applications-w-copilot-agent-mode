from django.contrib import admin
from .models import Driver, Policy, Claim, Transaction, RiskZone, Referral, Notification


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'balance_gourdes', 'rc_active', 'risk_score', 'moto_count', 'created_at']
    list_filter = ['rc_active']
    search_fields = ['user__username', 'phone', 'vignette_number']


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ['driver', 'plan', 'status', 'amount_gourdes', 'start_date', 'end_date']
    list_filter = ['plan', 'status']
    search_fields = ['driver__user__username', 'moncash_ref']


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ['id', 'driver', 'amount_gourdes', 'status', 'auto_approved', 'created_at', 'paid_at']
    list_filter = ['status', 'auto_approved']
    search_fields = ['driver__user__username', 'moncash_ref']
    readonly_fields = ['created_at', 'updated_at', 'paid_at']

    actions = ['approve_claims', 'reject_claims']

    def approve_claims(self, request, queryset):
        from django.utils import timezone
        import uuid
        for claim in queryset.filter(status=Claim.STATUS_UNDER_REVIEW):
            ref = f"MC-{uuid.uuid4().hex[:8].upper()}"
            claim.status = Claim.STATUS_PAID
            claim.moncash_ref = ref
            claim.paid_at = timezone.now()
            claim.reviewed_by = str(request.user)
            claim.save()
            claim.driver.balance_gourdes += claim.amount_gourdes
            claim.driver.save()
        self.message_user(request, "Claims approuvés et payés.")
    approve_claims.short_description = "Approuver et payer les sinistres sélectionnés"

    def reject_claims(self, request, queryset):
        queryset.filter(status=Claim.STATUS_UNDER_REVIEW).update(
            status=Claim.STATUS_REJECTED,
            reviewed_by=str(request.user)
        )
    reject_claims.short_description = "Rejeter les sinistres sélectionnés"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['driver', 'amount_gourdes', 'tx_type', 'description', 'created_at']
    list_filter = ['tx_type']
    search_fields = ['driver__user__username', 'reference']


@admin.register(RiskZone)
class RiskZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'risk_score', 'level', 'active', 'updated_at']
    list_filter = ['level', 'active', 'city']
    search_fields = ['name', 'city']


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ['referrer', 'referee_phone', 'status', 'bonus_gourdes', 'created_at']
    list_filter = ['status']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['driver', 'title', 'notif_type', 'read', 'created_at']
    list_filter = ['notif_type', 'read']
    search_fields = ['driver__user__username', 'title']
