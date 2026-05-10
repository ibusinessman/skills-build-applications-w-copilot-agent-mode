import uuid
from django.db import models
from django.contrib.auth.models import User


def _short_uuid():
    return uuid.uuid4().hex[:8].upper()


class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    phone = models.CharField(max_length=20, unique=True)
    vignette_number = models.CharField(max_length=50, blank=True)
    balance_gourdes = models.IntegerField(default=0)
    rc_active = models.BooleanField(default=False)
    risk_score = models.FloatField(default=0.3)
    referral_code = models.CharField(max_length=12, unique=True, blank=True, default='')
    moto_count = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'drivers'

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = _short_uuid()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} ({self.phone})"


class Policy(models.Model):
    PLAN_RC_PRO = 'RC_PRO'
    PLAN_RC_PREMIUM = 'RC_PREMIUM'
    PLAN_CHOICES = [
        (PLAN_RC_PRO, 'RC Pro 300g/mois'),
        (PLAN_RC_PREMIUM, 'RC Premium 500g/mois'),
    ]
    STATUS_PENDING = 'pending'
    STATUS_ACTIVE = 'active'
    STATUS_EXPIRED = 'expired'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_ACTIVE, 'Actif'),
        (STATUS_EXPIRED, 'Expiré'),
        (STATUS_CANCELLED, 'Annulé'),
    ]
    PLAN_AMOUNTS = {PLAN_RC_PRO: 300, PLAN_RC_PREMIUM: 500}

    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='policies')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_RC_PRO)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    amount_gourdes = models.IntegerField(default=300)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    moncash_ref = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'policies'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.driver} – {self.plan} ({self.status})"


class Claim(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_AUTO_APPROVED = 'auto_approved'
    STATUS_UNDER_REVIEW = 'under_review'
    STATUS_APPROVED = 'approved'
    STATUS_PAID = 'paid'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_AUTO_APPROVED, 'Auto-approuvé'),
        (STATUS_UNDER_REVIEW, 'En révision'),
        (STATUS_APPROVED, 'Approuvé'),
        (STATUS_PAID, 'Payé'),
        (STATUS_REJECTED, 'Rejeté'),
    ]

    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='claims')
    amount_gourdes = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    description = models.TextField(blank=True)
    photo_url = models.URLField(blank=True, max_length=500)
    moncash_phone = models.CharField(max_length=20, blank=True)
    auto_approved = models.BooleanField(default=False)
    moncash_ref = models.CharField(max_length=100, blank=True)
    reviewed_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'claims'
        ordering = ['-created_at']

    def __str__(self):
        return f"Claim #{self.pk} – {self.driver} {self.amount_gourdes}g ({self.status})"


class Transaction(models.Model):
    TYPE_CREDIT = 'credit'
    TYPE_DEBIT = 'debit'
    TYPE_POLICY = 'policy_payment'
    TYPE_CLAIM_PAYOUT = 'claim_payout'
    TYPE_REFERRAL = 'referral_bonus'
    TYPE_CHOICES = [
        (TYPE_CREDIT, 'Crédit'),
        (TYPE_DEBIT, 'Débit'),
        (TYPE_POLICY, 'Paiement Police'),
        (TYPE_CLAIM_PAYOUT, 'Paiement Sinistre'),
        (TYPE_REFERRAL, 'Bonus Parrainage'),
    ]

    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='transactions')
    amount_gourdes = models.IntegerField()
    tx_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        sign = '+' if self.amount_gourdes > 0 else ''
        return f"{sign}{self.amount_gourdes}g {self.tx_type} – {self.driver}"


class RiskZone(models.Model):
    LEVEL_LOW = 'low'
    LEVEL_MEDIUM = 'medium'
    LEVEL_HIGH = 'high'
    LEVEL_CRITICAL = 'critical'
    LEVEL_CHOICES = [
        (LEVEL_LOW, 'Bas'),
        (LEVEL_MEDIUM, 'Moyen'),
        (LEVEL_HIGH, 'Élevé'),
        (LEVEL_CRITICAL, 'Critique'),
    ]

    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100, default='Port-au-Prince')
    lat = models.FloatField()
    lng = models.FloatField()
    risk_score = models.FloatField()
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default=LEVEL_MEDIUM)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'risk_zones'
        ordering = ['-risk_score']

    def __str__(self):
        return f"{self.name} ({self.level} – {self.risk_score})"


class Referral(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_REGISTERED = 'registered'
    STATUS_BONUS_PAID = 'bonus_paid'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_REGISTERED, 'Inscrit'),
        (STATUS_BONUS_PAID, 'Bonus Payé'),
    ]

    referrer = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='referrals_made')
    referee_phone = models.CharField(max_length=20)
    referee_driver = models.ForeignKey(
        Driver, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='referred_by'
    )
    bonus_gourdes = models.IntegerField(default=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referrals'
        unique_together = [('referrer', 'referee_phone')]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.referrer} → {self.referee_phone} ({self.status})"


class Notification(models.Model):
    TYPE_RISK = 'risk_alert'
    TYPE_POLICY = 'policy'
    TYPE_CLAIM = 'claim'
    TYPE_PAYMENT = 'payment'
    TYPE_REFERRAL = 'referral'
    TYPE_PROMO = 'promo'
    TYPE_CHOICES = [
        (TYPE_RISK, 'Alerte Risque'),
        (TYPE_POLICY, 'Police'),
        (TYPE_CLAIM, 'Sinistre'),
        (TYPE_PAYMENT, 'Paiement'),
        (TYPE_REFERRAL, 'Parrainage'),
        (TYPE_PROMO, 'Promotion'),
    ]

    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notif_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_PROMO)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notif_type}] {self.title}"
