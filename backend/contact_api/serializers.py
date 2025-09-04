from rest_framework import serializers
from . models import Contacts

class ContactSerializers(serializers.ModelSerializer):
    class Meta:
        model= Contacts
        fields=['id','name','email']
