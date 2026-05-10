from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Driver, Policy, Claim, Transaction, RiskZone, Referral, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class DriverSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'full_name', 'phone', 'vignette_number',
            'balance_gourdes', 'rc_active', 'risk_score',
            'referral_code', 'moto_count', 'created_at',
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(max_length=20)
    first_name = serializers.CharField(max_length=50, required=False, default='')
    last_name = serializers.CharField(max_length=50, required=False, default='')
    referral_code = serializers.CharField(max_length=12, required=False, default='')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already in use.")
        return value

    def validate_phone(self, value):
        if Driver.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already registered.")
        return value


class PolicySerializer(serializers.ModelSerializer):
    plan_display = serializers.CharField(source='get_plan_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Policy
        fields = [
            'id', 'driver', 'plan', 'plan_display', 'status', 'status_display',
            'amount_gourdes', 'start_date', 'end_date', 'days_remaining',
            'moncash_ref', 'created_at',
        ]
        read_only_fields = [
            'driver', 'status', 'start_date', 'end_date',
            'moncash_ref', 'created_at',
        ]

    def get_days_remaining(self, obj):
        if obj.end_date and obj.status == Policy.STATUS_ACTIVE:
            from django.utils import timezone
            delta = obj.end_date - timezone.now().date()
            return max(delta.days, 0)
        return None


class ClaimSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Claim
        fields = [
            'id', 'driver', 'amount_gourdes', 'status', 'status_display',
            'description', 'photo_url', 'moncash_phone', 'auto_approved',
            'moncash_ref', 'reviewed_by', 'created_at', 'updated_at', 'paid_at',
        ]
        read_only_fields = [
            'driver', 'status', 'auto_approved', 'moncash_ref',
            'reviewed_by', 'created_at', 'updated_at', 'paid_at',
        ]


class TransactionSerializer(serializers.ModelSerializer):
    tx_type_display = serializers.CharField(source='get_tx_type_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'driver', 'amount_gourdes', 'tx_type', 'tx_type_display',
            'description', 'reference', 'created_at',
        ]


class RiskZoneSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = RiskZone
        fields = [
            'id', 'name', 'city', 'lat', 'lng',
            'risk_score', 'level', 'level_display', 'description', 'updated_at',
        ]


class ReferralSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Referral
        fields = [
            'id', 'referrer', 'referee_phone', 'referee_driver',
            'bonus_gourdes', 'status', 'status_display', 'created_at',
        ]
        read_only_fields = [
            'referrer', 'referee_driver', 'bonus_gourdes', 'status', 'created_at',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    notif_type_display = serializers.CharField(source='get_notif_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'driver', 'title', 'message',
            'notif_type', 'notif_type_display', 'read', 'created_at',
        ]
        read_only_fields = ['driver', 'created_at']
