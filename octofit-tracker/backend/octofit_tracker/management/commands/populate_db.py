from django.core.management.base import BaseCommand
from octofit_tracker.models import User, Team, Activity, Leaderboard, Workout
from datetime import timedelta


class Command(BaseCommand):
    help = 'Populate the database with test data for users, teams, activities, leaderboard, and workouts'

    def handle(self, *args, **kwargs):
        # Clear existing data
        Leaderboard.objects.all().delete()
        Activity.objects.all().delete()
        Team.objects.all().delete()
        User.objects.all().delete()
        Workout.objects.all().delete()

        # Create users (Mergington High School superhero students)
        users = [
            User.objects.create(username='thundergod', email='thundergod@mhigh.edu', password='thundergodpassword'),
            User.objects.create(username='metalgeek', email='metalgeek@mhigh.edu', password='metalgeekpassword'),
            User.objects.create(username='zerocool', email='zerocool@mhigh.edu', password='zerocoolpassword'),
            User.objects.create(username='crashoverride', email='crashoverride@mhigh.edu', password='crashoverridepassword'),
            User.objects.create(username='sleeptoken', email='sleeptoken@mhigh.edu', password='sleeptokenpassword'),
        ]
        self.stdout.write(self.style.SUCCESS('Created users'))

        # Create teams
        blue_team = Team.objects.create(name='Blue Team')
        blue_team.members.add(users[0], users[1], users[2])

        gold_team = Team.objects.create(name='Gold Team')
        gold_team.members.add(users[3], users[4])
        self.stdout.write(self.style.SUCCESS('Created teams'))

        # Create activities
        activities = [
            Activity.objects.create(user=users[0], activity_type='Cycling', duration=timedelta(hours=1)),
            Activity.objects.create(user=users[1], activity_type='Crossfit', duration=timedelta(hours=2)),
            Activity.objects.create(user=users[2], activity_type='Running', duration=timedelta(hours=1, minutes=30)),
            Activity.objects.create(user=users[3], activity_type='Strength', duration=timedelta(minutes=30)),
            Activity.objects.create(user=users[4], activity_type='Swimming', duration=timedelta(hours=1, minutes=15)),
        ]
        self.stdout.write(self.style.SUCCESS('Created activities'))

        # Create leaderboard entries
        leaderboard_data = [
            (users[0], 100),
            (users[2], 95),
            (users[1], 90),
            (users[3], 85),
            (users[4], 80),
        ]
        for user, score in leaderboard_data:
            Leaderboard.objects.create(user=user, score=score)
        self.stdout.write(self.style.SUCCESS('Created leaderboard entries'))

        # Create workouts
        workouts = [
            Workout.objects.create(name='Cycling Training', description='Training for a road cycling event'),
            Workout.objects.create(name='Crossfit', description='Training for a crossfit competition'),
            Workout.objects.create(name='Running Training', description='Training for a marathon'),
            Workout.objects.create(name='Strength Training', description='Training for strength'),
            Workout.objects.create(name='Swimming Training', description='Training for a swimming competition'),
        ]
        self.stdout.write(self.style.SUCCESS('Created workouts'))

        self.stdout.write(self.style.SUCCESS('Successfully populated the database with test data.'))
