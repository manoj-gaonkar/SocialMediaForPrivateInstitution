from django.contrib import admin

from .models import *

# Register your models here.

admin.site.register(User)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Follower)
admin.site.register(Adminmodel)
admin.site.register(authusers)
admin.site.register(usersettings)
#admin.site.register(Like)
#admin.site.register(Saved)