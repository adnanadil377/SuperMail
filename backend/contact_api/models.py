from django.db import models

# Create your models here.
class Contacts(models.Model):
    name=models.CharField(max_length=100)
    email=models.EmailField()
    relation=models.CharField(max_length=100)
    tone=models.TextField()

    def __str__(self):
        return self.name
