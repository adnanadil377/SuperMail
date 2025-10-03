from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from . models import Contacts
from .serializers import ContactSerializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class ContactView(APIView):
    
    permission_classes=[IsAuthenticated]

    def get(self, request):
        result = Contacts.objects.filter(user=request.user)
        serializer = ContactSerializers(result, many=True)
        return Response(serializer.data)
    
    def post(self,request):
        serializer=ContactSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ContactDetailView(APIView):

    permission_classes=[IsAuthenticated]
    def get(self, request, pk):
        contact = get_object_or_404(Contacts, pk=pk, user=request.user)
        serializer = ContactSerializers(contact)
        return Response(serializer.data)

    def patch(self, request, pk):
        contact = get_object_or_404(Contacts, pk=pk, user=request.user)
        serializer = ContactSerializers(contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        contact = get_object_or_404(Contacts, pk=pk, user=request.user)
        contact.delete()
        return Response({"message": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT)