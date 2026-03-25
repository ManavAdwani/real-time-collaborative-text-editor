import os

settings_path = r'c:\wamp64\www\real_time_collab_text_editor\backend\core\settings.py'

with open(settings_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'PASSWORD': 'Mahi@7781'", "'PASSWORD': 'root'")

with open(settings_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated settings.py!")
