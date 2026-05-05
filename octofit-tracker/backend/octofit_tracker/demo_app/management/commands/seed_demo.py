from datetime import timedelta
from django.core.management.base import BaseCommand
from octofit_tracker.demo_app.models import User, Team, Activity, Leaderboard, Workout


class Command(BaseCommand):
    help = 'Populate the demo SQLite database with test data'

    def handle(self, *args, **kwargs):
        Activity.objects.all().delete()
        Leaderboard.objects.all().delete()
        Workout.objects.all().delete()
        Team.objects.all().delete()
        User.objects.all().delete()

        users = [
            User.objects.create(username='thundergod', email='thundergod@mhigh.edu', password='thundergodpassword'),
            User.objects.create(username='metalgeek', email='metalgeek@mhigh.edu', password='metalgeekpassword'),
            User.objects.create(username='zerocool', email='zerocool@mhigh.edu', password='zerocoolpassword'),
            User.objects.create(username='crashoverride', email='crashoverride@mhigh.edu', password='crashoverridepassword'),
            User.objects.create(username='sleeptoken', email='sleeptoken@mhigh.edu', password='sleeptokenpassword'),
        ]

        team_blue = Team.objects.create(name='Blue Team')
        team_blue.members.set(users)
        team_gold = Team.objects.create(name='Gold Team')
        team_gold.members.set(users[:3])

        Activity.objects.create(user=users[0], activity_type='Cycling', duration=timedelta(hours=1))
        Activity.objects.create(user=users[1], activity_type='Crossfit', duration=timedelta(hours=2))
        Activity.objects.create(user=users[2], activity_type='Running', duration=timedelta(hours=1, minutes=30))
        Activity.objects.create(user=users[3], activity_type='Strength', duration=timedelta(minutes=30))
        Activity.objects.create(user=users[4], activity_type='Swimming', duration=timedelta(hours=1, minutes=15))

        Leaderboard.objects.create(user=users[0], score=100)
        Leaderboard.objects.create(user=users[1], score=90)
        Leaderboard.objects.create(user=users[2], score=95)
        Leaderboard.objects.create(user=users[3], score=85)
        Leaderboard.objects.create(user=users[4], score=80)

        Workout.objects.create(name='Cycling Training', description='Training for a road cycling event')
        Workout.objects.create(name='Crossfit', description='Training for a crossfit competition')
        Workout.objects.create(name='Running Training', description='Training for a marathon')
        Workout.objects.create(name='Strength Training', description='Training for strength')
        Workout.objects.create(name='Swimming Training', description='Training for a swimming competition')

        self.stdout.write(self.style.SUCCESS('Demo DB seeded.'))
