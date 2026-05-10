"""
Seed realistic demo data for XtraAssurance.
Usage: python manage.py seed_data
"""
import uuid
from datetime import date, timedelta
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.authtoken.models import Token

from api.models import Driver, Policy, Claim, Transaction, RiskZone, Referral, Notification


RISK_ZONES = [
    {'name': 'Cité Soleil',        'city': 'Port-au-Prince', 'lat': 18.5680, 'lng': -72.3320, 'risk_score': 0.95, 'level': 'critical', 'description': 'Zone de haute criminalité – RC obligatoire'},
    {'name': 'Martissant',         'city': 'Port-au-Prince', 'lat': 18.5236, 'lng': -72.3512, 'risk_score': 0.90, 'level': 'critical', 'description': 'Activité de gangs élevée'},
    {'name': 'Croix-des-Bouquets', 'city': 'Port-au-Prince', 'lat': 18.5791, 'lng': -72.2175, 'risk_score': 0.80, 'level': 'high',     'description': 'Risque d\'accidents élevé'},
    {'name': 'Delmas 32',          'city': 'Port-au-Prince', 'lat': 18.5620, 'lng': -72.3170, 'risk_score': 0.75, 'level': 'high',     'description': 'Forte densité de trafic'},
    {'name': 'Route Nationale 1',  'city': 'Port-au-Prince', 'lat': 18.5432, 'lng': -72.3380, 'risk_score': 0.70, 'level': 'high',     'description': 'Route à risque – vitesse excessive'},
    {'name': 'Tabarre',            'city': 'Port-au-Prince', 'lat': 18.5910, 'lng': -72.2890, 'risk_score': 0.55, 'level': 'medium',   'description': 'Zone résidentielle modérée'},
    {'name': 'Pétion-Ville',       'city': 'Port-au-Prince', 'lat': 18.5122, 'lng': -72.2875, 'risk_score': 0.40, 'level': 'medium',   'description': 'Zone commerciale, risque modéré'},
    {'name': 'Cap-Haïtien Centre', 'city': 'Cap-Haïtien',   'lat': 19.7575, 'lng': -72.2040, 'risk_score': 0.45, 'level': 'medium',   'description': 'Centre-ville, trafic dense'},
    {'name': 'Jacmel Plage',       'city': 'Jacmel',        'lat': 18.2341, 'lng': -72.5356, 'risk_score': 0.25, 'level': 'low',      'description': 'Zone touristique, risque faible'},
    {'name': 'Les Cayes',          'city': 'Les Cayes',     'lat': 18.1941, 'lng': -73.7508, 'risk_score': 0.30, 'level': 'low',      'description': 'Ville provinciale, calme'},
]

DRIVERS = [
    {'username': 'jean_moto',   'email': 'jean@xtra.ht',    'first_name': 'Jean',   'last_name': 'Pierre',    'phone': '50937100001', 'balance': 2_000_000, 'risk_score': 0.82, 'moto_count': 3},
    {'username': 'marie_ride',  'email': 'marie@xtra.ht',   'first_name': 'Marie',  'last_name': 'Dubois',    'phone': '50937100002', 'balance': 850_000,   'risk_score': 0.45, 'moto_count': 1},
    {'username': 'paul_taxi',   'email': 'paul@xtra.ht',    'first_name': 'Paul',   'last_name': 'Joseph',    'phone': '50937100003', 'balance': 1_200_000, 'risk_score': 0.60, 'moto_count': 2},
    {'username': 'rose_driver', 'email': 'rose@xtra.ht',    'first_name': 'Rose',   'last_name': 'Auguste',   'phone': '50937100004', 'balance': 400_000,   'risk_score': 0.30, 'moto_count': 1},
    {'username': 'demo',        'email': 'demo@xtra.ht',    'first_name': 'Demo',   'last_name': 'Xtra',      'phone': '50937100000', 'balance': 2_000_000, 'risk_score': 0.82, 'moto_count': 1},
]


class Command(BaseCommand):
    help = 'Seed XtraAssurance demo data (risk zones, drivers, policies, claims)'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding XtraAssurance data...')

        # Risk zones
        RiskZone.objects.all().delete()
        for z in RISK_ZONES:
            RiskZone.objects.create(**z)
        self.stdout.write(f'  ✅ {len(RISK_ZONES)} risk zones created')

        # Drivers
        drivers = []
        for d in DRIVERS:
            user, created = User.objects.get_or_create(
                username=d['username'],
                defaults={
                    'email': d['email'],
                    'first_name': d['first_name'],
                    'last_name': d['last_name'],
                },
            )
            if created:
                user.set_password('xtra2026!')
                user.save()
            Token.objects.get_or_create(user=user)

            driver, _ = Driver.objects.get_or_create(
                user=user,
                defaults={
                    'phone': d['phone'],
                    'balance_gourdes': d['balance'],
                    'risk_score': d['risk_score'],
                    'moto_count': d['moto_count'],
                    'vignette_number': f"HT-{uuid.uuid4().hex[:6].upper()}",
                },
            )
            drivers.append(driver)

        self.stdout.write(f'  ✅ {len(drivers)} drivers created (password: xtra2026!)')

        # Demo driver: jean_moto – active RC Pro
        jean = drivers[0]
        if not jean.policies.filter(status=Policy.STATUS_ACTIVE).exists():
            ref = f"MC-{uuid.uuid4().hex[:8].upper()}"
            policy = Policy.objects.create(
                driver=jean,
                plan=Policy.PLAN_RC_PRO,
                status=Policy.STATUS_ACTIVE,
                amount_gourdes=300,
                start_date=date.today() - timedelta(days=5),
                end_date=date.today() + timedelta(days=25),
                moncash_ref=ref,
            )
            jean.rc_active = True
            jean.balance_gourdes -= 300
            jean.save()
            Transaction.objects.create(
                driver=jean,
                amount_gourdes=-300,
                tx_type=Transaction.TYPE_POLICY,
                description=f'RC Pro – {policy.start_date} → {policy.end_date}',
                reference=ref,
            )

        # Demo claims for jean_moto
        if not jean.claims.exists():
            claim_data = [
                {'amount': 3500, 'status': Claim.STATUS_PAID,         'auto': True,  'desc': 'Accident Delmas 32 – frais médicaux'},
                {'amount': 1200, 'status': Claim.STATUS_PAID,         'auto': True,  'desc': 'Pneu crevé Martissant'},
                {'amount': 8000, 'status': Claim.STATUS_UNDER_REVIEW, 'auto': False, 'desc': 'Dommages véhicule Route Nationale 1'},
                {'amount': 2500, 'status': Claim.STATUS_PAID,         'auto': True,  'desc': 'Clinique Sainte-Croix consultation'},
            ]
            for i, c in enumerate(claim_data):
                ref = f"MC-{uuid.uuid4().hex[:8].upper()}" if c['status'] == Claim.STATUS_PAID else ''
                claim = Claim.objects.create(
                    driver=jean,
                    amount_gourdes=c['amount'],
                    status=c['status'],
                    description=c['desc'],
                    auto_approved=c['auto'],
                    moncash_phone=jean.phone,
                    moncash_ref=ref,
                    paid_at=timezone.now() - timedelta(days=i) if c['status'] == Claim.STATUS_PAID else None,
                )
                if c['status'] == Claim.STATUS_PAID:
                    Transaction.objects.create(
                        driver=jean,
                        amount_gourdes=c['amount'],
                        tx_type=Transaction.TYPE_CLAIM_PAYOUT,
                        description=f'Payout Sinistre #{claim.pk}',
                        reference=ref,
                    )

        # Referral: jean referred marie
        marie = drivers[1]
        Referral.objects.get_or_create(
            referrer=jean,
            referee_phone=marie.phone,
            defaults={
                'referee_driver': marie,
                'status': Referral.STATUS_BONUS_PAID,
                'bonus_gourdes': 50,
            },
        )

        # Notifications for jean
        if not jean.notifications.exists():
            notifs = [
                ('🚨 Xtra Alert: Cité Soleil – Risque Critique!', 'Evite zone sa a jodi a. RC ou aktif pou pwoteksyon ou.', Notification.TYPE_RISK),
                ('⚡ Payout MonCash Konfime!', '3500g voye sou MonCash 50937100001 – Ref MC-A1B2C3D4', Notification.TYPE_PAYMENT),
                ('✅ RC Xtra Pro Aktive!', f'Pwoteksyon ou aktif jiska {date.today() + timedelta(days=25)}.', Notification.TYPE_POLICY),
                ('🎁 Bonus Parrainage Reçu!', '50g ajouté – Marie Dubois vien d\'s\'enregistrer.', Notification.TYPE_REFERRAL),
                ('Byenveni Xtra Assurance! 🎉', 'Dubai Quality, Ayiti Protection. Ou kounye a pwoteje!', Notification.TYPE_PROMO),
            ]
            for title, msg, ntype in notifs:
                Notification.objects.create(driver=jean, title=title, message=msg, notif_type=ntype)

        self.stdout.write('  ✅ Demo claims, referrals, notifications seeded')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('🎉 Seed complete!'))
        self.stdout.write('')
        self.stdout.write('Demo credentials:')
        self.stdout.write('  username: demo  | password: xtra2026!')
        self.stdout.write('  username: jean_moto | password: xtra2026!')
        self.stdout.write('')
        self.stdout.write('API base: http://localhost:8000/api/')
        self.stdout.write('Admin:    http://localhost:8000/admin/')
