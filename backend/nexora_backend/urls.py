from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import HttpResponse, FileResponse
import os

def serve_frontend(request):
    index_path = settings.FRONTEND_DIST / 'index.html'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    return HttpResponse("NexoraAI Backend Running. Frontend build in progress...")

def serve_assets(request, path):
    file_path = settings.FRONTEND_DIST / 'assets' / path
    if file_path.exists():
        return FileResponse(open(file_path, 'rb'))
    return HttpResponse(status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chat_api.urls')),
    re_path(r'^assets/(?P<path>.*)$', serve_assets),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA fallback
urlpatterns += [
    re_path(r'^(?!api|admin|media|assets).*$', serve_frontend),
]
