from django.forms import ModelForm
from django import forms
from .models import Post

class Postform(ModelForm):
    class Meta:
        model = Post
        fields = ['creater','content_text','content_image']
        widgets = {
            'content_text':forms.Textarea(attrs={
                'class':"h-32 rounded-md max-h-96 outline-none text-black px-2 py-1  ",
                'placeholder': "enter the caption"
            }),
            'content_image':forms.FileInput(attrs={
                'class': "hidden",
                'accept':".jpg,.jpeg"
            })
        }
