import uuid
from django.conf import settings
from django.db import models

class Range(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=64)
    path = models.CharField(max_length=256)
    combos_json = models.JSONField()
