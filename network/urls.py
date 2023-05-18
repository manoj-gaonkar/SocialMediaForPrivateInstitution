
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("n/login", views.login_view, name="login"),
    path("n/logout", views.logout_view, name="logout"),
    path("n/register", views.register, name="register"),
    path("profile/<str:username>", views.profile, name='profile'),
    path("n/explore", views.explore, name='explore'),
    path("n/saved", views.saved, name="saved"),
    path("n/createpost", views.create_post, name="createpost"),
    path("n/post/<int:id>/like", views.like_post, name="likepost"),
    path("n/post/<int:id>/unlike", views.unlike_post, name="unlikepost"),
    path("n/post/<int:id>/save", views.save_post, name="savepost"),
    path("n/post/<int:id>/unsave", views.unsave_post, name="unsavepost"),
    path("n/post/<int:post_id>/comments", views.comment, name="comments"),
    path("n/post/<int:post_id>/write_comment",views.comment, name="writecomment"),
    path("n/post/<int:post_id>/delete", views.delete_post, name="deletepost"),
    path("<str:username>/follow", views.follow, name="followuser"),
    path("<str:username>/unfollow", views.unfollow, name="unfollowuser"),
    path("n/post/<int:post_id>/edit", views.edit_post, name="editpost"),
    # these are urls for the admin
    path("n/admin/login/", views.adminlogin, name="adminlogin"),
    path("n/admin/", views.adminpage, name="adminpage"),
    path('n/admin/logout',views.adminlogout,name='adminlogout'),
    path("n/admin/removeuser/<str:email>",views.removeuser,name='removeuser'),
    path("n/admin/changevalid/<str:id>",views.changevalid,name='changevalid'),
    # url for dark mode
    path('update_dark_mode/', views.update_dark_mode, name='update_dark_mode'),
    path('editprofile/<int:pk>/',views.editProfile,name='editprofile'),
    path('n/searchuser/',views.searchuser,name='searchuser'),
    path('n/postdetails/<int:post_id>',views.postdetails,name='postdetails')
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

