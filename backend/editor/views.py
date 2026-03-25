from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Document, ChangeLog
from .serializers import DocumentSerializer, UserSerializer, RegisterSerializer, ChangeLogSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from diff_match_patch import diff_match_patch

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Document.objects.filter(
            Q(owner=user) | Q(shared_with=user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        document = self.get_object()
        
        # Only owner can share
        if document.owner != request.user:
            return Response({'error': 'Only owner can share'}, status=status.HTTP_403_FORBIDDEN)
            
        username = request.data.get('username')
        try:
            user_to_share = User.objects.get(username=username)
            if user_to_share == request.user:
                return Response({'error': 'You already own this document.'}, status=status.HTTP_400_BAD_REQUEST)
            document.shared_with.add(user_to_share)
            return Response({'status': f'Document shared with {username}'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        document = self.get_object()
        
        # Chronological order
        all_logs = document.change_logs.exclude(content_snapshot__isnull=True).exclude(content_snapshot="").order_by('version')
        
        import datetime
        filtered_logs = []
        last_timestamp = None
        
        for log in all_logs:
            if last_timestamp is None or (log.timestamp - last_timestamp).total_seconds() >= 10:
                filtered_logs.append(log)
                last_timestamp = log.timestamp
                
        # Guarantee highest version is always accessible
        if all_logs.exists() and all_logs.last() not in filtered_logs:
            filtered_logs.append(all_logs.last())
            
        filtered_logs.reverse() # Newest first for UI
        serializer = ChangeLogSerializer(filtered_logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        document = self.get_object()
        target_version = request.data.get('version')
        try:
            log = document.change_logs.get(version=target_version)
            if not log.content_snapshot:
                return Response({'error': 'Snapshot missing'}, status=400)
            
            dmp = diff_match_patch()
            patches = dmp.patch_make(document.content, log.content_snapshot)
            patch_text = dmp.patch_toText(patches)
            
            document.content = log.content_snapshot
            document.version += 1
            document.save()
            
            ChangeLog.objects.create(
                document=document,
                version=document.version,
                operation={"patch": "RESTORE"},
                content_snapshot=document.content
            )
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"document_{document.id}",
                {
                    'type': 'document_message',
                    'patch': patch_text,
                    'version': document.version,
                    'sender_channel_name': 'server_restore'
                }
            )
            return Response({'status': 'Restored successfully'})
        except ChangeLog.DoesNotExist:
            return Response({'error': 'Version not found'}, status=404)
