from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User, Team, Activity, Leaderboard, Workout
from datetime import timedelta


class UserAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='thundergod',
            email='thundergod@mhigh.edu',
            password='testpassword'
        )

    def test_get_users(self):
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_user(self):
        data = {'username': 'newuser', 'email': 'newuser@mhigh.edu', 'password': 'testpass'}
        response = self.client.post('/api/users/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ActivityAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='metalgeek',
            email='metalgeek@mhigh.edu',
            password='testpassword'
        )
        self.activity = Activity.objects.create(
            user=self.user,
            activity_type='Running',
            duration=timedelta(hours=1)
        )

    def test_get_activities(self):
        response = self.client.get('/api/activities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LeaderboardAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='zerocool',
            email='zerocool@mhigh.edu',
            password='testpassword'
        )
        self.entry = Leaderboard.objects.create(user=self.user, score=100)

    def test_get_leaderboard(self):
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class WorkoutAPITestCase(APITestCase):
    def setUp(self):
        self.workout = Workout.objects.create(
            name='Running Training',
            description='Training for a marathon'
        )

    def test_get_workouts(self):
        response = self.client.get('/api/workouts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TeamAPITestCase(APITestCase):
    def setUp(self):
        self.team = Team.objects.create(name='Blue Team')

    def test_get_teams(self):
        response = self.client.get('/api/teams/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
