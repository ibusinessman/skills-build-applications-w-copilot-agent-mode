from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserSerializer, TeamSerializer, ActivitySerializer, LeaderboardSerializer, WorkoutSerializer
from .models import User, Team, Activity, Leaderboard, Workout


@api_view(['GET'])
def api_root(request, format=None):
    # Use codespace URL if running in GitHub Codespaces, otherwise use request URL
    # Replace your-codespace-name with your actual codespace name
    # Example: https://your-codespace-name-8000.app.github.dev
    base_url = request.build_absolute_uri('/').rstrip('/')
    return Response({
        'users': base_url + '/api/users/?format=api',
        'teams': base_url + '/api/teams/?format=api',
        'activities': base_url + '/api/activities/?format=api',
        'leaderboard': base_url + '/api/leaderboard/?format=api',
        'workouts': base_url + '/api/workouts/?format=api',
    })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer


class LeaderboardViewSet(viewsets.ModelViewSet):
    queryset = Leaderboard.objects.all().order_by('-score')
    serializer_class = LeaderboardSerializer


class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.all()
    serializer_class = WorkoutSerializer
