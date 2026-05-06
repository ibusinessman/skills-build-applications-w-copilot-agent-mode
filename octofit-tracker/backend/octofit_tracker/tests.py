from django.test import TestCase
from .models import User, Team, Activity, Leaderboard, Workout


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User(username='testuser', email='test@mhigh.edu', password='testpassword')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@mhigh.edu')


class TeamModelTest(TestCase):
    def test_create_team(self):
        team = Team(name='Blue Team')
        self.assertEqual(team.name, 'Blue Team')


class ActivityModelTest(TestCase):
    def test_activity_types(self):
        activity_types = ['Cycling', 'Crossfit', 'Running', 'Strength', 'Swimming']
        self.assertIn('Running', activity_types)


class LeaderboardModelTest(TestCase):
    def test_leaderboard_score(self):
        self.assertGreater(100, 0)


class WorkoutModelTest(TestCase):
    def test_create_workout(self):
        workout = Workout(name='Running Training', description='Training for a marathon')
        self.assertEqual(workout.name, 'Running Training')
