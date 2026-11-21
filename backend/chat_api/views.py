"""
Django REST Framework API Views for NexoraAI.
Complies with SRS Section 4 & Section 7.
"""

import os
import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserAccount, Conversation, Message, Attachment, Document, Notification
from .gemini_service import generate_nexora_response
from .media_service import generate_ai_image, generate_ai_video, generate_ai_audio, ensure_media_dirs

# Default Starter Chats for Recent Chats list as per SRS 6.2
DEFAULT_STARTER_CHATS = [
    {"title": "Analyze this document", "prompt": "Please summarize and extract the key action items from this document."},
    {"title": "Generate a project idea", "prompt": "Give me a creative full-stack AI project idea combining React and Django."},
    {"title": "Image for presentation", "prompt": "Generate an image of modern clean AI architecture for a tech conference presentation."},
    {"title": "Convert speech to text", "prompt": "Explain how modern speech-to-text audio transcription models work."},
    {"title": "Explain Docker basics", "prompt": "Explain Docker basics, containers vs images, and how to write a Dockerfile."}
]

def seed_default_chats_for_user(email: str):
    """Seed the exact sample chats specified in SRS 6.2 if none exist."""
    if not Conversation.objects.filter(user_email=email).exists():
        for item in DEFAULT_STARTER_CHATS:
            c = Conversation.objects.create(
                user_email=email,
                title=item["title"]
            )
            Message.objects.create(
                conversation=c,
                role='user',
                content=item["prompt"]
            )
            resp = generate_nexora_response(item["prompt"], user_email=email)
            Message.objects.create(
                conversation=c,
                role='assistant',
                content=resp["content"],
                modality=resp["modality"],
                media_url=resp.get("media_url"),
                media_type=resp.get("media_type")
            )

class RegisterView(APIView):
    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not name or not email or not password:
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({"error": "Password must be at least 8 characters long."}, status=status.HTTP_400_BAD_REQUEST)

        if UserAccount.objects.filter(email=email).exists():
            return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = UserAccount.objects.create(
            name=name,
            email=email,
            password=password
        )

        seed_default_chats_for_user(email)

        Notification.objects.create(
            user_email=email,
            title="Welcome to NexoraAI",
            message="Your multimodal AI workspace is ready. You can ask anything or generate images, videos, and audio."
        )

        return Response({
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "token": f"nexora_token_{user.id}"
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        user = UserAccount.objects.filter(email=email).first()
        if not user or user.password != password:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        seed_default_chats_for_user(email)

        return Response({
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "token": f"nexora_token_{user.id}"
        })

class LogoutView(APIView):
    def post(self, request):
        return Response({"message": "Successfully signed out."})

class ConversationListView(APIView):
    def get(self, request):
        email = request.query_params.get('email', 'guest@nexora.ai')
        seed_default_chats_for_user(email)
        convs = Conversation.objects.filter(user_email=email)
        data = [{
            "id": c.id,
            "title": c.title,
            "pinned": c.pinned,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat()
        } for c in convs]
        return Response(data)

    def post(self, request):
        email = request.data.get('email', 'guest@nexora.ai')
        title = request.data.get('title', 'New Chat')
        conv = Conversation.objects.create(user_email=email, title=title)
        return Response({
            "id": conv.id,
            "title": conv.title,
            "pinned": conv.pinned,
            "created_at": conv.created_at.isoformat()
        }, status=status.HTTP_201_CREATED)

class ConversationDetailView(APIView):
    def get(self, request, pk):
        conv = Conversation.objects.filter(id=pk).first()
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        messages = conv.messages.all()
        msg_data = []
        for m in messages:
            msg_data.append({
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "modality": m.modality,
                "media_url": m.media_url,
                "media_type": m.media_type,
                "attachments_data": getattr(m, 'attachments_data', []),
                "sources": m.sources,
                "feedback": m.feedback,
                "created_at": m.created_at.isoformat()
            })
        return Response({
            "id": conv.id,
            "title": conv.title,
            "pinned": conv.pinned,
            "messages": msg_data
        })

    def patch(self, request, pk):
        conv = Conversation.objects.filter(id=pk).first()
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        if 'title' in request.data:
            conv.title = request.data['title']
        if 'pinned' in request.data:
            conv.pinned = request.data['pinned']
        conv.save()
        return Response({"id": conv.id, "title": conv.title, "pinned": conv.pinned})

    def delete(self, request, pk):
        conv = Conversation.objects.filter(id=pk).first()
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        conv.delete()
        return Response({"message": "Conversation deleted successfully."})

class MessageListView(APIView):
    def get(self, request, pk):
        conv = Conversation.objects.filter(id=pk).first()
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        messages = [{
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "modality": m.modality,
            "media_url": m.media_url,
            "media_type": m.media_type,
            "attachments_data": getattr(m, 'attachments_data', []),
            "sources": m.sources,
            "feedback": m.feedback,
            "created_at": m.created_at.isoformat()
        } for m in conv.messages.all()]
        return Response(messages)

    def post(self, request, pk):
        conv = Conversation.objects.filter(id=pk).first()
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '').strip()
        attachments = request.data.get('attachments', [])
        email = conv.user_email

        if not content and not attachments:
            return Response({"error": "Content or attachments required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Save User Message with attachments & media URL
        user_media_url = None
        user_modality = 'text'
        if attachments:
            user_modality = attachments[0].get('file_type', 'file')
            user_media_url = attachments[0].get('file_url')

        user_msg = Message.objects.create(
            conversation=conv,
            role='user',
            content=content or (attachments[0].get('file_name', 'Attached file') if attachments else "Attached file"),
            modality=user_modality,
            media_url=user_media_url,
            attachments_data=attachments
        )

        # Auto-update conversation title from the first message
        if conv.title == 'New Chat' or conv.title.startswith('New Conversation'):
            words = (content or "Chat").split()
            conv.title = " ".join(words[:5])
            conv.save()

        # Load conversation history
        history = [{"role": m.role, "content": m.content} for m in conv.messages.exclude(id=user_msg.id)]
        user_docs = list(Document.objects.filter(user_email=email).values('id', 'title', 'content_text'))

        # 2. Generate Nexora Response
        result = generate_nexora_response(
            user_message=content,
            history=history,
            attachments=attachments,
            user_docs=user_docs,
            user_email=email
        )

        # 3. Save Assistant Message
        assistant_msg = Message.objects.create(
            conversation=conv,
            role='assistant',
            content=result['content'],
            modality=result.get('modality', 'text'),
            media_url=result.get('media_url'),
            media_type=result.get('media_type'),
            sources=result.get('sources', [])
        )

        return Response({
            "user_message": {
                "id": str(user_msg.id),
                "role": user_msg.role,
                "content": user_msg.content,
                "modality": user_msg.modality,
                "media_url": user_msg.media_url,
                "attachments_data": user_msg.attachments_data,
                "created_at": user_msg.created_at.isoformat()
            },
            "assistant_message": {
                "id": str(assistant_msg.id),
                "role": assistant_msg.role,
                "content": assistant_msg.content,
                "modality": assistant_msg.modality,
                "media_url": assistant_msg.media_url,
                "media_type": assistant_msg.media_type,
                "sources": assistant_msg.sources,
                "created_at": assistant_msg.created_at.isoformat()
            }
        })

class FeedbackView(APIView):
    def post(self, request, pk):
        msg = Message.objects.filter(id=pk).first()
        if not msg:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
        msg.feedback = int(request.data.get('feedback', 1))
        msg.save()
        return Response({"message": "Feedback recorded."})

class UploadView(APIView):
    def post(self, request):
        ensure_media_dirs()
        file = request.FILES.get('file')
        file_type = request.data.get('type', 'document')
        email = request.data.get('email', 'guest@nexora.ai')

        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower()
        safe_base = os.path.splitext(file.name)[0].replace(' ', '_')
        unique_name = f"{safe_base}_{uuid.uuid4().hex[:6]}{ext}"
        save_path = settings.MEDIA_ROOT / 'uploads' / unique_name
        with open(save_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        file_url = f"/media/uploads/{unique_name}"

        extracted_text = ""
        if ext in ['.txt', '.md', '.csv', '.json', '.py', '.js', '.html']:
            try:
                with open(save_path, 'r', encoding='utf-8', errors='ignore') as f:
                    extracted_text = f.read(5000)
            except Exception:
                extracted_text = f"Content of {file.name}"
        else:
            extracted_text = f"Uploaded file: {file.name} ({file_type})"

        att = Attachment.objects.create(
            user_email=email,
            file_type=file_type,
            file_name=file.name,
            file_url=file_url,
            size=file.size,
            extracted_text=extracted_text
        )

        Document.objects.create(
            user_email=email,
            title=file.name,
            content_text=extracted_text,
            domain='user_upload',
            source_file=file_url
        )

        Notification.objects.create(
            user_email=email,
            title="File Uploaded Successfully",
            message=f"'{file.name}' has been processed and added to your Library."
        )

        return Response({
            "id": str(att.id),
            "file_name": att.file_name,
            "file_url": att.file_url,
            "file_type": att.file_type,
            "size": att.size,
            "extracted_text": att.extracted_text
        }, status=status.HTTP_201_CREATED)

class LibraryListView(APIView):
    def get(self, request):
        email = request.query_params.get('email', 'guest@nexora.ai')
        file_type = request.query_params.get('type')
        qs = Attachment.objects.filter(user_email=email)
        if file_type and file_type != 'all':
            qs = qs.filter(file_type=file_type)

        data = [{
            "id": str(a.id),
            "file_name": a.file_name,
            "file_url": a.file_url,
            "file_type": a.file_type,
            "size": a.size,
            "created_at": a.created_at.isoformat()
        } for a in qs]
        return Response(data)

    def delete(self, request):
        pk = request.query_params.get('id')
        att = Attachment.objects.filter(id=pk).first()
        if not att:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
        att.delete()
        return Response({"message": "File removed from Library."})

class GenerateImageView(APIView):
    def post(self, request):
        prompt = request.data.get('prompt', 'Modern AI Art')
        email = request.data.get('email', 'guest@nexora.ai')
        media = generate_ai_image(prompt, user_email=email)
        
        Attachment.objects.create(
            user_email=email,
            file_type='image',
            file_name=media['filename'],
            file_url=media['url'],
            extracted_text=f"Generated Image: {prompt}"
        )
        return Response(media)

class GenerateVideoView(APIView):
    def post(self, request):
        prompt = request.data.get('prompt', 'Motion Graphics')
        email = request.data.get('email', 'guest@nexora.ai')
        media = generate_ai_video(prompt, user_email=email)

        Attachment.objects.create(
            user_email=email,
            file_type='video',
            file_name=media['filename'],
            file_url=media['url'],
            extracted_text=f"Generated Video: {prompt}"
        )
        return Response(media)

class GenerateAudioView(APIView):
    def post(self, request):
        text = request.data.get('text', 'Hello from NexoraAI')
        email = request.data.get('email', 'guest@nexora.ai')
        media = generate_ai_audio(text, user_email=email)

        Attachment.objects.create(
            user_email=email,
            file_type='audio',
            file_name=media['filename'],
            file_url=media['url'],
            extracted_text=f"Generated Audio: {text[:50]}"
        )
        return Response(media)

class NotificationListView(APIView):
    def get(self, request):
        email = request.query_params.get('email', 'guest@nexora.ai')
        notifs = Notification.objects.filter(user_email=email)
        data = [{
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at.isoformat()
        } for n in notifs]
        return Response(data)

    def patch(self, request):
        email = request.data.get('email', 'guest@nexora.ai')
        Notification.objects.filter(user_email=email).update(read=True)
        return Response({"message": "All notifications marked as read."})

class ApiKeyView(APIView):
    def get(self, request):
        key = getattr(settings, 'GEMINI_API_KEY', '')
        masked = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else (key or "Not configured")
        return Response({
            "api_key_masked": masked,
            "has_key": bool(key and not key.startswith('placeholder'))
        })

    def post(self, request):
        new_key = request.data.get('api_key', '').strip()
        if new_key:
            settings.GEMINI_API_KEY = new_key
            return Response({"message": "Gemini API key updated successfully.", "has_key": True})
        return Response({"error": "No API key provided"}, status=status.HTTP_400_BAD_REQUEST)

class ExploreView(APIView):
    def get(self, request):
        categories = [
            {
                "title": "Technology & Programming",
                "icon": "Code",
                "cards": [
                    {"title": "Basics of C++ Programming", "prompt": "Can you teach me the basics of C++ programming with examples?"},
                    {"title": "Dockerizing a Full-Stack App", "prompt": "Explain Docker basics and how to write a Dockerfile for a React and Django app."},
                    {"title": "Reverse Singly Linked List", "prompt": "Write Python code to reverse a singly linked list with O(n) time and O(1) space."}
                ]
            },
            {
                "title": "Healthcare & Wellness",
                "icon": "Heart",
                "cards": [
                    {"title": "Nutrition Plate Guide", "prompt": "Explain the ideal balanced plate for daily nutrition, macronutrients and fiber."},
                    {"title": "Headache & Fatigue Relief", "prompt": "I have had a mild headache for 2 days. What are safe home measures and doctor red flags?"},
                    {"title": "Sleep Hygiene Plan", "prompt": "Give me an actionable 5-step night routine to improve my sleep quality."}
                ]
            },
            {
                "title": "General Knowledge & Real Life",
                "icon": "Globe",
                "cards": [
                    {"title": "The 7 Continents", "prompt": "What are the 7 continents of the world and their key characteristics?"},
                    {"title": "Tenant Security Deposit Help", "prompt": "My landlord hasn't returned my security deposit for 6 weeks. What are my options?"},
                    {"title": "Indian Constitution Fundamentals", "prompt": "Summarize the Fundamental Rights guaranteed under the Indian Constitution."}
                ]
            },
            {
                "title": "Multimodal Creation",
                "icon": "Sparkles",
                "cards": [
                    {"title": "Generate AI Image", "prompt": "Generate an image of a futuristic neural technology city in terracotta and cream."},
                    {"title": "Synthesize AI Speech", "prompt": "Generate audio of a warm welcoming announcement for NexoraAI."},
                    {"title": "Generate AI Video", "prompt": "Generate a video of cosmic particle flow and galaxy rotation."}
                ]
            }
        ]
        return Response(categories)
