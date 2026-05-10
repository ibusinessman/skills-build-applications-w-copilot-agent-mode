from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# backend/xtra_backend/urls.py → 2 levels up = backend/ → 1 more = xtra-assurance/
_BACKEND_DIR = Path(__file__).resolve().parent.parent
FRONTEND_BUILD = _BACKEND_DIR.parent / "dist"


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

# Serve React SPA in production (when dist/ exists)
if FRONTEND_BUILD.exists():
    from django.views.static import serve as static_serve

    urlpatterns += [
        # Built JS/CSS/assets
        re_path(
            r'^assets/(?P<path>.*)$',
            static_serve,
            {'document_root': FRONTEND_BUILD / 'assets'},
        ),
        # Public files: sw.js, manifest.json, icons
        re_path(
            r'^(?P<path>sw\.js|manifest\.json|icon.*\.svg|.*\.png|.*\.ico)$',
            static_serve,
            {'document_root': FRONTEND_BUILD},
        ),
        # All remaining routes → React index.html (SPA client-side routing)
        re_path(r'^(?!api/|admin/|health/|assets/).*$', TemplateView.as_view(
            template_name='index.html',
        )),
    ]
