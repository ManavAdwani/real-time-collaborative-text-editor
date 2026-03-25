import uuid
from django.db import models
from django.contrib.auth.models import User
import uuid

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, default='Untitled Document')
    content = models.TextField(default='')
    version = models.IntegerField(default=0)
    owner = models.ForeignKey(User, related_name='owned_documents', on_delete=models.CASCADE, null=True)
    shared_with = models.ManyToManyField(User, related_name='shared_documents', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (v{self.version})"

class ChangeLog(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='change_logs')
    version = models.IntegerField()
    operation = models.JSONField()  # Storing the Quill Delta representation
    content_snapshot = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['version']
        unique_together = ('document', 'version')

    def __str__(self):
        return f"{self.document.title} - Version {self.version}"
