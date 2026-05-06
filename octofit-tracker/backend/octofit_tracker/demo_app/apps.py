from django.apps import AppConfig


class DemoAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'octofit_tracker.demo_app'
    label = 'demo_app'
