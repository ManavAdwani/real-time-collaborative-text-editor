import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Document
from .services.ot_service import apply_patch_to_document
from asgiref.sync import sync_to_async
from rest_framework.authtoken.models import Token
from django.db.models import Q
from urllib.parse import parse_qs

@sync_to_async
def get_user_from_token(token_key):
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return None

@sync_to_async
def can_access_document(user, document_id):
    if not user:
        return False
    try:
        doc = Document.objects.get(id=document_id)
        if doc.owner == user or user in doc.shared_with.all():
            return True
        return False
    except Document.DoesNotExist:
        return False

class EditorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.room_group_name = f'document_{self.document_id}'

        query_string = self.scope['query_string'].decode()
        parsed_qs = parse_qs(query_string)
        token_key = parsed_qs.get('token', [None])[0]

        if not token_key:
            await self.close()
            return

        user = await get_user_from_token(token_key)
        has_access = await can_access_document(user, self.document_id)

        if not has_access:
            await self.close()
            return
            
        self.username = user.username

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'username': self.username,
                'action': 'joined'
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            if hasattr(self, 'username'):
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'presence_update',
                        'username': self.username,
                        'action': 'left'
                    }
                )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('action')

        if message_type == 'edit':
            patch_text = data.get('patch')
            base_version = data.get('base_version')

            try:
                # Apply diff matching patch atomically
                new_version, new_patch_text, new_content = await sync_to_async(apply_patch_to_document)(
                    self.document_id, base_version, patch_text
                )

                if new_version is not None:
                    # Broadcast confirmed patch to all clients in group
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'document_message',
                            'patch': new_patch_text,
                            'version': new_version,
                            'sender_channel_name': self.channel_name
                        }
                    )
            except Exception as e:
                # Handle conflicting or invalid edits gracefully
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': str(e)
                }))

        elif message_type == 'cursor':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'cursor_message',
                    'username': self.username,
                    'range': data.get('range'),
                    'sender_channel_name': self.channel_name
                }
            )

    async def document_message(self, event):
        # Don't send the message back to the sender
        if self.channel_name != event['sender_channel_name']:
            await self.send(text_data=json.dumps({
                'type': 'sync', # Fixed to match frontend
                'patch': event['patch'],
                'version': event['version']
            }))

    async def cursor_message(self, event):
        if self.channel_name != event['sender_channel_name']:
            await self.send(text_data=json.dumps({
                'type': 'cursor',
                'username': event['username'],
                'range': event['range']
            }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'username': event['username'],
            'action': event['action']
        }))
