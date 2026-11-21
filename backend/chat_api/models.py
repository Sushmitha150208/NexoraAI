from django.db import models
import uuid

class UserAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.email})"

class Conversation(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    user_email = models.EmailField(default='guest@nexora.ai')
    title = models.CharField(max_length=255, default='New Chat')
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title

class Message(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )
    MODALITY_CHOICES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('file', 'File'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    modality = models.CharField(max_length=20, choices=MODALITY_CHOICES, default='text')
    media_url = models.CharField(max_length=1000, blank=True, null=True)
    media_type = models.CharField(max_length=50, blank=True, null=True)
    attachments_data = models.JSONField(default=list, blank=True)
    sources = models.JSONField(default=list, blank=True)
    feedback = models.IntegerField(default=0) # 1 for thumbs up, -1 for thumbs down
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"

class Attachment(models.Model):
    TYPE_CHOICES = (
        ('image', 'Image'),
        ('audio', 'Audio'),
        ('video', 'Video'),
        ('document', 'Document'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, related_name='attachments', on_delete=models.SET_NULL, null=True, blank=True)
    user_email = models.EmailField(default='guest@nexora.ai')
    file_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/', blank=True, null=True)
    file_url = models.CharField(max_length=1000)
    size = models.BigIntegerField(default=0)
    extracted_text = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, default='ready')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_email = models.EmailField(default='guest@nexora.ai')
    title = models.CharField(max_length=255)
    content_text = models.TextField()
    domain = models.CharField(max_length=50, default='general')
    source_file = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_email = models.EmailField(default='guest@nexora.ai')
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
