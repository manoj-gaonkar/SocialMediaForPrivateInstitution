from django.forms import ModelForm
from django import forms
from .models import Post

class Postform(ModelForm):
    class Meta:
        model = Post
        fields = ['creater','content_text','content_image']
        widgets = {
            'content_text':forms.Textarea(attrs={
                'class':"h-32 rounded-md max-h-96 outline-none text-black dark:text-white text-sm  px-2 py-1 dark:bg-zinc-800 bg-gray-100 ",
                'placeholder': "enter the caption",
                'rows': '100',
                'columns': '150',
            }),
            'content_image':forms.FileInput(attrs={
                'class': "hidden  ",
                'accept':".jpg,.jpeg"
            })
        }
