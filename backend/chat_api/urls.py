from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    ConversationListView, ConversationDetailView,
    MessageListView, FeedbackView,
    UploadView, LibraryListView,
    GenerateImageView, GenerateVideoView, GenerateAudioView,
    NotificationListView, ExploreView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),

    # Chats
    path('chats/', ConversationListView.as_view(), name='chat-list'),
    path('chats/<str:pk>/', ConversationDetailView.as_view(), name='chat-detail'),
    path('chats/<str:pk>/messages/', MessageListView.as_view(), name='chat-messages'),
    path('messages/<str:pk>/feedback/', FeedbackView.as_view(), name='message-feedback'),

    # Multimodal Uploads & Library
    path('uploads/', UploadView.as_view(), name='upload-file'),
    path('library/', LibraryListView.as_view(), name='library-list'),

    # Generation Jobs
    path('generate/image/', GenerateImageView.as_view(), name='generate-image'),
    path('generate/video/', GenerateVideoView.as_view(), name='generate-video'),
    path('generate/audio/', GenerateAudioView.as_view(), name='generate-audio'),

    # Notifications & Explore
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('explore/', ExploreView.as_view(), name='explore'),
]
