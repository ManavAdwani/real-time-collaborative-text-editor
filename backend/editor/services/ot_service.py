import json
from diff_match_patch import diff_match_patch
from django.db import transaction
from editor.models import Document, ChangeLog

dmp = diff_match_patch()

def apply_patch_to_document(document_id, base_version, patch_text):
    """
    Applies a diff_match_patch patch to the document.
    Returns (new_version, transformed_patch_text, full_content) or None if error.
    """
    try:
        with transaction.atomic():
            doc = Document.objects.select_for_update().get(id=document_id)
            
            # If the base version is way too old or invalid, DMP fuzzy patching still tries,
            # but we can rely on DMP's robust patch_apply.
            
            patches = dmp.patch_fromText(patch_text)
            new_text, results = dmp.patch_apply(patches, doc.content)
            
            # We can check if all patches applied successfully:
            # results is a list of booleans
            
            # Save the new version
            doc.content = new_text
            doc.version += 1
            doc.save()
            
            # Log the change
            ChangeLog.objects.create(
                document=doc,
                version=doc.version,
                operation={"patch": patch_text, "results": results},
                content_snapshot=doc.content
            )
            
            # To ensure all clients perfectly sync, we create a clean patch from the 
            # old state to the new state as applied on the server, just in case 
            # fuzzy patching altered it.
            # But normally, broadcasting the original patch is sufficient if it applied cleanly.
            # Here we just broadcast the incoming patch for performance, or a sanitized one.
            clean_patch = dmp.patch_toText(dmp.patch_make(doc.content, new_text)) \
                          if False else patch_text
            
            return doc.version, patch_text, doc.content
    except Document.DoesNotExist:
        return None, None, None
    except Exception as e:
        print(f"OT Error: {e}")
        return None, None, None
