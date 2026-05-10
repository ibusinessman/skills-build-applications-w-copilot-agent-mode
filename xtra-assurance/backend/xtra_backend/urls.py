from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({
        'status': 'ok',
        'app': 'Xtra Assurance API',
        'version': 'DubaiEd1.0-20260510',
        'brand': 'Dubai Quality, Ayiti Protection 🇦🇪🇭🇹',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health/', health),
]
