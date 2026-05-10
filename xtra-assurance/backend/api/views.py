import uuid
from datetime import date, timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Driver, Policy, Claim, Transaction,
    RiskZone, Referral, Notification,
)
from .serializers import (
    RegisterSerializer, DriverSerializer,
    PolicySerializer, ClaimSerializer,
    TransactionSerializer, RiskZoneSerializer,
    ReferralSerializer, NotificationSerializer,
)

AUTO_APPROVE_THRESHOLD = getattr(settings, 'MONCASH_AUTO_APPROVE_THRESHOLD', 5000)
REFERRAL_BONUS = getattr(settings, 'REFERRAL_BONUS_GOURDES', 50)
INITIAL_BALANCE = getattr(settings, 'INITIAL_BALANCE_GOURDES', 2_000_000)


def _moncash_ref():
    return f"MC-{uuid.uuid4().hex[:8].upper()}"


def _get_driver(request):
    try:
        return request.user.driver_profile
    except Driver.DoesNotExist:
        return None


# ── AUTH ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )
    driver = Driver.objects.create(
        user=user,
        phone=data['phone'],
        balance_gourdes=INITIAL_BALANCE,
    )

    # Apply referral bonus if code provided
    ref_code = data.get('referral_code', '').strip().upper()
    if ref_code:
        try:
            referrer = Driver.objects.get(referral_code=ref_code)
            ref = Referral.objects.create(
                referrer=referrer,
                referee_phone=data['phone'],
                referee_driver=driver,
                status=Referral.STATUS_REGISTERED,
            )
            referrer.balance_gourdes += REFERRAL_BONUS
            referrer.save()
            Transaction.objects.create(
                driver=referrer,
                amount_gourdes=REFERRAL_BONUS,
                tx_type=Transaction.TYPE_REFERRAL,
                description=f'Bonus parrainage – {data["phone"]} inscrit',
                reference=ref_code,
            )
            Notification.objects.create(
                driver=referrer,
                title='🎁 Bonus Parrainage Reçu!',
                message=f'{REFERRAL_BONUS}g ajouté – {data["phone"]} vien d\'s\'enregistrer.',
                notif_type=Notification.TYPE_REFERRAL,
            )
        except Driver.DoesNotExist:
            pass

    Notification.objects.create(
        driver=driver,
        title='Byenveni Xtra Assurance! 🎉',
        message='Ou kounye a pwoteje ak Xtra Asirans Dubai. Aktivez RC Pro 300g pou kouvèti konplè.',
        notif_type=Notification.TYPE_PROMO,
    )
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {'token': token.key, 'driver': DriverSerializer(driver).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        driver = user.driver_profile
    except Driver.DoesNotExist:
        return Response({'error': 'Profil chauffeur introuvable'}, status=status.HTTP_404_NOT_FOUND)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'driver': DriverSerializer(driver).data})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    driver = _get_driver(request)
    if not driver:
        return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        allowed = {'phone', 'vignette_number', 'moto_count'}
        for field in allowed:
            if field in request.data:
                setattr(driver, field, request.data[field])
        driver.save()

    return Response(DriverSerializer(driver).data)


# ── DASHBOARD ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    driver = _get_driver(request)
    if not driver:
        return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)

    active_policy = driver.policies.filter(status=Policy.STATUS_ACTIVE).order_by('-created_at').first()
    recent_claims = driver.claims.order_by('-created_at')[:5]
    recent_txs = driver.transactions.order_by('-created_at')[:5]
    high_risk_zones = RiskZone.objects.filter(active=True, risk_score__gte=0.7).order_by('-risk_score')[:3]

    return Response({
        'balance_gourdes': driver.balance_gourdes,
        'rc_active': driver.rc_active,
        'risk_score': driver.risk_score,
        'moto_count': driver.moto_count,
        'referral_code': driver.referral_code,
        'active_policy': PolicySerializer(active_policy).data if active_policy else None,
        'recent_claims': ClaimSerializer(recent_claims, many=True).data,
        'recent_transactions': TransactionSerializer(recent_txs, many=True).data,
        'high_risk_zones': RiskZoneSerializer(high_risk_zones, many=True).data,
        'unread_notifications': driver.notifications.filter(read=False).count(),
        'stats': {
            'total_claims': driver.claims.count(),
            'paid_claims': driver.claims.filter(status=Claim.STATUS_PAID).count(),
            'total_referrals': driver.referrals_made.count(),
            'paid_referrals': driver.referrals_made.filter(status=Referral.STATUS_BONUS_PAID).count(),
        },
    })


# ── WALLET ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet(request):
    driver = _get_driver(request)
    if not driver:
        return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)

    txs = driver.transactions.order_by('-created_at')[:30]
    return Response({
        'balance_gourdes': driver.balance_gourdes,
        'transactions': TransactionSerializer(txs, many=True).data,
    })


# ── POLICIES ──────────────────────────────────────────────────────────────────

class PolicyViewSet(viewsets.ModelViewSet):
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        driver = _get_driver(self.request)
        if not driver:
            return Policy.objects.none()
        return driver.policies.all()

    def create(self, request, *args, **kwargs):
        driver = _get_driver(request)
        if not driver:
            return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)

        plan = request.data.get('plan', Policy.PLAN_RC_PRO)
        if plan not in dict(Policy.PLAN_CHOICES):
            return Response({'error': 'Plan invalide'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Policy.PLAN_AMOUNTS.get(plan, 300)
        policy = Policy.objects.create(
            driver=driver,
            plan=plan,
            amount_gourdes=amount,
            status=Policy.STATUS_PENDING,
        )
        return Response(PolicySerializer(policy).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        policy = self.get_object()
        if policy.status == Policy.STATUS_ACTIVE:
            return Response({'error': 'Police déjà active'}, status=status.HTTP_400_BAD_REQUEST)
        if policy.status == Policy.STATUS_CANCELLED:
            return Response({'error': 'Police annulée'}, status=status.HTTP_400_BAD_REQUEST)

        driver = policy.driver
        if driver.balance_gourdes < policy.amount_gourdes:
            return Response({'error': 'Solde insuffisant'}, status=status.HTTP_400_BAD_REQUEST)

        ref = _moncash_ref()
        driver.balance_gourdes -= policy.amount_gourdes
        driver.rc_active = True
        driver.save()

        policy.status = Policy.STATUS_ACTIVE
        policy.start_date = date.today()
        policy.end_date = date.today() + timedelta(days=30)
        policy.moncash_ref = ref
        policy.save()

        Transaction.objects.create(
            driver=driver,
            amount_gourdes=-policy.amount_gourdes,
            tx_type=Transaction.TYPE_POLICY,
            description=f'{policy.get_plan_display()} – {policy.start_date} → {policy.end_date}',
            reference=ref,
        )
        Notification.objects.create(
            driver=driver,
            title='✅ RC Xtra Pro Aktive!',
            message=f'Pwoteksyon ou aktif jiska {policy.end_date}. Ref: {ref}',
            notif_type=Notification.TYPE_POLICY,
        )
        return Response(PolicySerializer(policy).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        policy = self.get_object()
        if policy.status not in (Policy.STATUS_PENDING, Policy.STATUS_ACTIVE):
            return Response({'error': 'Non annulable'}, status=status.HTTP_400_BAD_REQUEST)
        policy.status = Policy.STATUS_CANCELLED
        policy.save()
        if policy.driver.policies.filter(status=Policy.STATUS_ACTIVE).count() == 0:
            policy.driver.rc_active = False
            policy.driver.save()
        return Response(PolicySerializer(policy).data)


# ── CLAIMS ────────────────────────────────────────────────────────────────────

class ClaimViewSet(viewsets.ModelViewSet):
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        driver = _get_driver(self.request)
        if not driver:
            return Claim.objects.none()
        return driver.claims.all()

    def create(self, request, *args, **kwargs):
        driver = _get_driver(request)
        if not driver:
            return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = int(request.data.get('amount_gourdes', 0))
        except (TypeError, ValueError):
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Montant doit être positif'}, status=status.HTTP_400_BAD_REQUEST)

        auto_approved = amount < AUTO_APPROVE_THRESHOLD
        claim = Claim.objects.create(
            driver=driver,
            amount_gourdes=amount,
            status=Claim.STATUS_AUTO_APPROVED if auto_approved else Claim.STATUS_UNDER_REVIEW,
            description=request.data.get('description', ''),
            photo_url=request.data.get('photo_url', ''),
            moncash_phone=request.data.get('moncash_phone', driver.phone),
            auto_approved=auto_approved,
        )

        if auto_approved:
            ref = _moncash_ref()
            claim.status = Claim.STATUS_PAID
            claim.moncash_ref = ref
            claim.paid_at = timezone.now()
            claim.save()

            driver.balance_gourdes += amount
            driver.save()

            Transaction.objects.create(
                driver=driver,
                amount_gourdes=amount,
                tx_type=Transaction.TYPE_CLAIM_PAYOUT,
                description=f'Payout Sinistre #{claim.pk} – Auto-approuvé Dubai AI',
                reference=ref,
            )
            Notification.objects.create(
                driver=driver,
                title='⚡ Payout MonCash Konfime!',
                message=f'{amount}g voye sou MonCash {claim.moncash_phone} nan 5 minit. Ref: {ref}',
                notif_type=Notification.TYPE_PAYMENT,
            )
        else:
            Notification.objects.create(
                driver=driver,
                title='🔍 Reklamasyon an Revizyon',
                message=f'Reklamasyon {amount}g anba revizyon ekspè. Repons nan 1h.',
                notif_type=Notification.TYPE_CLAIM,
            )

        return Response(ClaimSerializer(claim).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        claim = self.get_object()
        if claim.status in (Claim.STATUS_PAID, Claim.STATUS_REJECTED):
            return Response({'error': 'Claim ne peut plus être modifié'}, status=status.HTTP_400_BAD_REQUEST)
        allowed = {'description', 'photo_url', 'moncash_phone'}
        for field in allowed:
            if field in request.data:
                setattr(claim, field, request.data[field])
        claim.save()
        return Response(ClaimSerializer(claim).data)


# ── RISK ZONES ────────────────────────────────────────────────────────────────

class RiskZoneViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RiskZone.objects.filter(active=True).order_by('-risk_score')
    serializer_class = RiskZoneSerializer
    permission_classes = [IsAuthenticated]


# ── REFERRALS ─────────────────────────────────────────────────────────────────

class ReferralViewSet(viewsets.ModelViewSet):
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        driver = _get_driver(self.request)
        if not driver:
            return Referral.objects.none()
        return driver.referrals_made.all()

    def create(self, request, *args, **kwargs):
        driver = _get_driver(request)
        if not driver:
            return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)

        phone = request.data.get('referee_phone', '').strip()
        if not phone:
            return Response({'error': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)
        if phone == driver.phone:
            return Response({'error': 'Vous ne pouvez pas vous auto-parrainer'}, status=status.HTTP_400_BAD_REQUEST)

        referral, created = Referral.objects.get_or_create(
            referrer=driver, referee_phone=phone,
            defaults={'status': Referral.STATUS_PENDING},
        )
        if not created:
            return Response({'error': 'Déjà parrainé ce numéro'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ReferralSerializer(referral).data, status=status.HTTP_201_CREATED)


# ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        driver = _get_driver(self.request)
        if not driver:
            return Notification.objects.none()
        return driver.notifications.all()

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['patch'])
    def read_all(self, request):
        driver = _get_driver(request)
        if not driver:
            return Response({'error': 'Profil introuvable'}, status=status.HTTP_404_NOT_FOUND)
        updated = driver.notifications.filter(read=False).update(read=True)
        return Response({'marked_read': updated})
