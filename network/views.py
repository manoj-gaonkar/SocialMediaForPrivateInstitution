from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
import json
from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os
from .models import *
from .forms import Postform
# below import for using many conditions in filter
from django.db.models import Q

def index(request):
    if request.user.is_anonymous:
        return redirect('login')
    # this code is to cheeck if the user is valid, if not the user is  made to logout of the site by admin
    if request.user.is_anonymous==False:
        if authusers.objects.filter(email=request.user.email).first().valid != True:
            messages.error(request, 'admin kicked you out')
            logout(request)
            return redirect('login')

    following_user = Follower.objects.filter(followers=request.user).values('user')
    all_posts = Post.objects.filter(Q(creater__in=following_user) | Q(creater=request.user)).order_by('-date_created')
    paginator = Paginator(all_posts, 10)
    page_number = request.GET.get('page')
    if page_number == None:
        page_number = 1
    posts = paginator.get_page(page_number)
    followings = []
    suggestions = []
    if request.user.is_authenticated:
        followings = Follower.objects.filter(followers=request.user).values_list('user', flat=True)
        suggestions = User.objects.exclude(pk__in=followings).exclude(username=request.user.username).exclude(pk=1).order_by("?")[:6]
        # print(request.user.id)
        # print(request.user.password)
    try:
        model,created = usersettings.objects.get_or_create(user=request.user)
        if created:
            pass
        else:
            model.save()
        user_mode = model.dark_mode
    except Exception as e:
        print('exception in dark mode === ', e)
        user_mode = True

    # user post creation form 
    return render(request, "network/index.html", {
        "posts": posts,
        "all_posts":all_posts,
        "suggestions": suggestions,
        "page": "all_posts",
        'profile': False,
        'user_mode': user_mode,
        'form': Postform,
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["username"]
        password = request.POST["password"]
        if email in authusers.objects.values_list('email',flat=True):
            if authusers.objects.filter(email=email).first().valid == False:
                return render(request,'network/login.html',{
                    'message':'Invalid email!'
                })


        if email not in User.objects.values_list('email',flat=True):
            return render(request,'network/login.html',{
                "message":"Invalid email and/password"
            })
        else:
            username = User.objects.filter(email=email).first().username
        user = authenticate(request, username=username, password=password)
        print()

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        fname = request.POST["firstname"]
        lname = request.POST["lastname"]
        profile = request.FILES.get("profile")
        print(f"--------------------------Profile: {profile}----------------------------")
        cover = request.FILES.get('cover')
        print(f"--------------------------Cover: {cover}----------------------------")

        # for checking if username in the authusers model (admin)
        if email not in authusers.objects.values_list('email',flat=True):  
            return render(request, 'network/register.html',{
                'emailmessage': 'You email is not authorized. Please contact your admin.'
            })
        elif email in User.objects.values_list('email',flat=True):
            return render(request,'network/register.html',{
                'emailmessage':'email already exists. Try logging in.'
            })
        else:
            if username not in User.objects.values_list('username',flat=True):
                if authusers.objects.filter(email=email).first().valid:
                    newusn = authusers.objects.filter(email=email).first()
                    if newusn:
                        newusn.user = username
                        newusn.save()
                    else:
                        pass
                else:
                    return render(request, 'network/register.html',{
                    'emailmessage': 'You are not a valid user. Please contact your admin.'
                })
            else:
                return render(request,'network/register.html',{
                    'message':'USN already exists.'
                })
            
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.first_name = fname
            user.last_name = lname
            if profile is not None:
                user.profile_pic = profile
            # else:
            #     user.profile_pic = "profile_pic/default_profile_pic.png"
            if cover is not None:
                user.cover = cover
            # else:
            #     user.cover = 'cover/default_cover_pic.png'
            user.save()
            Follower.objects.create(user=user)
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "USN already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")



def profile(request, username):
    if request.user.is_anonymous:
        return redirect('login')
    # this code is to cheeck if the user is valid, if not the user is  made to logout of the site by admin
    if request.user.is_anonymous==False:
        if authusers.objects.filter(email=request.user.email).first().valid != True:
            messages.error(request, 'admin kicked you out')
            logout(request)
            return redirect('login')

    user = User.objects.get(username=username)
    all_posts = Post.objects.filter(creater=user).order_by('-date_created')
    paginator = Paginator(all_posts, 10)
    page_number = request.GET.get('page')
    if page_number == None:
        page_number = 1
    posts = paginator.get_page(page_number)
    followings = []
    suggestions = []
    follower = False
    if request.user.is_authenticated:
        followings = Follower.objects.filter(followers=request.user).values_list('user', flat=True)
        suggestions = User.objects.exclude(pk__in=followings).exclude(pk=1).exclude(username=request.user.username).order_by("?")[:6]

        if request.user in Follower.objects.get(user=user).followers.all():

            follower = True
        else:
            follower=False
    
    follower_count = Follower.objects.get(user=user).followers.all().count()
    following_count = Follower.objects.filter(followers=user).count()
    try:
        model,created = usersettings.objects.get_or_create(user=request.user)
        if created:
            pass
        else:
            model.save()
        user_mode = model.dark_mode
    except Exception as e:
        print('exception in dark mode === ', e)
        user_mode = True

    followers = Follower.objects.get(user=user).followers.all()
    # followingObject = Follower.objects.filter(followers=user).all().values_list('user',flat=True)
    # following = Follower.objects.filter(user__in=followingObject).values('user')
    following = Follower.objects.filter(followers=user)

        
    return render(request, 'network/profile.html', {
        "all_posts": all_posts,
        "username": user,
        "posts": posts,
        "posts_count": all_posts.count(),
        "suggestions": suggestions,
        "page": "profile",
        "is_follower": follower,
        "follower_count": follower_count,
        "following_count": following_count,
        'user_mode': user_mode,
        "followers":followers,
        'followings':following,
        'form': Postform,
    })

def explore(request):
    if request.user.is_anonymous:
        return redirect('login')
    # this code is to cheeck if the user is valid, if not the user is  made to logout of the site by admin
    if request.user.is_anonymous==False:
        if authusers.objects.filter(email=request.user.email).first().valid != True:
            messages.error(request, 'admin kicked you out')
            logout(request)
            return redirect('login')
    if request.user.is_authenticated:
        following_user = Follower.objects.filter(followers=request.user).values('user')
        all_posts = Post.objects.all().order_by('?')
        paginator = Paginator(all_posts, 10)
        page_number = request.GET.get('page')
        if page_number == None:
            page_number = 1
        posts = paginator.get_page(page_number)
        followings = Follower.objects.filter(followers=request.user).values_list('user', flat=True)
        suggestions = User.objects.exclude(pk__in=followings).exclude(pk=1).exclude(username=request.user).order_by("?")[:6]
        try:
            model,created = usersettings.objects.get_or_create(user=request.user)
            if created:
                pass
            else:
                model.save()
            user_mode = model.dark_mode
        except Exception as e:
            print('exception in dark mode === ', e)
            user_mode = True
            
        return render(request, "network/explore.html", {
            "all_posts": all_posts,
            "posts": posts,
            "suggestions": suggestions,
            "page": "explore",
            'user_mode': user_mode,
        'form': Postform,
        })
    else:
        return HttpResponseRedirect(reverse('login'))

def saved(request):
    if request.user.is_anonymous:
        return redirect('login')
    # this code is to cheeck if the user is valid, if not the user is  made to logout of the site by admin
    if request.user.is_anonymous==False:
        if authusers.objects.filter(email=request.user.email).first().valid != True:
            messages.error(request, 'admin kicked you out')
            logout(request)
            return redirect('login')
    if request.user.is_authenticated:
        all_posts = Post.objects.filter(savers=request.user).order_by('-date_created')

        paginator = Paginator(all_posts, 10)
        page_number = request.GET.get('page')
        if page_number == None:
            page_number = 1
        posts = paginator.get_page(page_number)

        followings = Follower.objects.filter(followers=request.user).values_list('user', flat=True)
        suggestions = User.objects.exclude(pk__in=followings).exclude(pk=1).exclude(username=request.user.username).order_by("?")[:6]
        try:
            model,created = usersettings.objects.get_or_create(user=request.user)
            if created:
                pass
            else:
                model.save()
            user_mode = model.dark_mode
        except Exception as e:
            print('exception in dark mode === ', e)
            user_mode = True

        return render(request, "network/index.html", {
            "all_posts": all_posts,
            "posts": posts,
            "suggestions": suggestions,
            "page": "saved",
            'profile': False,
            'user_mode': user_mode,
        'form': Postform,
        })
    else:
        return HttpResponseRedirect(reverse('login'))
        


@login_required
def create_post(request):
    if request.method == "POST":
        content_text = request.POST['content_text']
        
        if request.FILES.get('content_image'):
            content_image = request.FILES.get('content_image')
            print("manoj")
        else:
            content_image = None
            print("not main")
        try:
            post = Post.objects.create(creater=request.user, content_text = content_text, content_image = content_image)
            return HttpResponseRedirect(reverse('index'))
        except Exception as e:
            return HttpResponse(e)
    return redirect('index')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@login_required
@csrf_exempt
def edit_post(request, post_id):
    if request.method == 'POST':
        text = request.POST.get('newtext')
        print(text)
        # pic = request.FILES.get('picture')
        # post_id = request.POST.get('id')
        post = Post.objects.get(id=post_id)
        try:
            post.content_text = text
            if post.content_image:
                old_image = post.content_image.url
                print(os.path.join(settings.MEDIA_ROOT,old_image))
                if request.FILES.get('picture'):
                    post.content_image = request.FILES.get('picture')
            post.save()
            
            return HttpResponseRedirect(reverse('index'))
        except Exception as e:
            print('-----------------------------------------------')
            print(e,"edit post error")
            print('-----------------------------------------------')
            return JsonResponse({
                "success": False
            })
    else:
            return HttpResponse("Method must be 'POST' rerr")

@csrf_exempt
def like_post(request, id):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            post = Post.objects.get(pk=id)
            print(post)
            try:
                post.likers.add(request.user)
                post.save()
                return HttpResponse(status=204)
            except Exception as e:
                return HttpResponse(e)
        else:
            return HttpResponse("Method must be 'PUT'")
    else:
        return HttpResponseRedirect(reverse('login'))

@csrf_exempt
def unlike_post(request, id):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            post = Post.objects.get(pk=id)
            print(post)
            try:
                post.likers.remove(request.user)
                post.save()
                return HttpResponse(status=204)
            except Exception as e:
                return HttpResponse(e)
        else:
            return HttpResponse("Method must be 'PUT'")
    else:
        return HttpResponseRedirect(reverse('login'))

@csrf_exempt
def save_post(request, id):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            post = Post.objects.get(pk=id)
            print(post)
            try:
                post.savers.add(request.user)
                post.save()
                return HttpResponse(status=204)
            except Exception as e:
                return HttpResponse(e)
        else:
            return HttpResponse("Method must be 'PUT'")
    else:
        return HttpResponseRedirect(reverse('login'))

@csrf_exempt
def unsave_post(request, id):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            post = Post.objects.get(pk=id)
            print(post)
            try:
                post.savers.remove(request.user)
                post.save()
                return HttpResponse(status=204)
            except Exception as e:
                return HttpResponse(e)
        else:
            return HttpResponse("Method must be 'PUT'")
    else:
        return HttpResponseRedirect(reverse('login'))

@csrf_exempt
def follow(request, username):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            user = User.objects.get(username=username)
            print(f".....................User: {user}......................")
            print(f".....................Follower: {request.user}......................")
            try:
                (follower, create) = Follower.objects.get_or_create(user=user)
                follower.followers.add(request.user)
                follower.save()
                return HttpResponse(status=204)
            except Exception as e:
                return HttpResponse(e)
        else:
            return HttpResponse("Method must be 'PUT'")
    else:
        return HttpResponseRedirect(reverse('login'))

@csrf_exempt
def unfollow(request, username):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            user = User.objects.get(username=username)
            print(f".....................User: {user}......................")
            print(f".....................Unfollower: {request.user}......................")
            try:
                follower = Follower.objects.get(user=user)
                follower.followers.remove(request.user)
                follower.save()
                return HttpResponse(status=204)
            except Exception as e:
                return HttpResponse(e)
        else:
            return HttpResponse("Method must be 'PUT'")
    else:
        return HttpResponseRedirect(reverse('login'))


@csrf_exempt
def comment(request, post_id):
    if request.user.is_authenticated:
        if request.method == 'POST':
            data = json.loads(request.body)
            comment = data.get('comment_text')
            post = Post.objects.get(id=post_id)
            try:
                newcomment = Comment.objects.create(post=post,commenter=request.user,comment_content=comment)
                post.comment_count += 1
                post.save()
                print(newcomment.serialize())
                return JsonResponse([newcomment.serialize()], safe=False, status=201)
            except Exception as e:
                return HttpResponse(e)
    
        post = Post.objects.get(id=post_id)
        comments = Comment.objects.filter(post=post)
        comments = comments.order_by('-comment_time').all()
        return JsonResponse([comment.serialize() for comment in comments], safe=False)
    else:
        return HttpResponseRedirect(reverse('login'))

@csrf_exempt
def delete_post(request, post_id):
    if request.user.is_authenticated:
            post = Post.objects.get(id=post_id)
            if request.user == post.creater:
                try:
                    delet = post.delete()
                    return redirect('/')
                except Exception as e:
                    return HttpResponse(e)
            else:
                return HttpResponse(status=404)
    else:
        return HttpResponseRedirect(reverse('login'))

def adminlogin(request):
    if request.method=='POST':
        uname = request.POST['username']
        password = request.POST['password']
        user = authenticate(request,username=uname,password=password)
        if user is not None and user.id in Adminmodel.objects.values_list('admin',flat=True) and Adminmodel.objects.filter(admin=user).values('is_superuser')[0]['is_superuser']:
            login(request, user)
            return HttpResponseRedirect(reverse('adminpage'))
        else:
            return render(request,'network/adminlogin.html',{
                'message':"username and password is invalid"
            })
    return render(request,'network/adminlogin.html')


@login_required(login_url='/n/admin/login')
def adminpage(request):
    if request.method=="POST":
        email = request.POST['email']
        valid = request.POST.getlist('check[]')
        print(valid)
        val = True if valid else False
        if email in authusers.objects.values_list('email',flat=True):
            messages.error(request,"email already exists in database")
            return redirect('adminpage')
            # return render(request,'network/admin.html',{
            #     'message':'email already exists in the database',
            #     'users':authusers.objects.values().order_by('-date_created')
            # })
        if email is not None:
            # email = User.objects.filter(username='4SU19CS052').values('email')[0]['email']
            b = authusers(email=email,valid=val)
            b.save()
        return redirect('adminpage')
    realusers = User.objects.values_list('username',flat=True) 
    return render(request,'network/admin.html',{
        'users':authusers.objects.filter(user__isnull=False).values().exclude(user='adminsuper').order_by('-date_created')
    })


def adminlogout(request):
    logout(request)
    return redirect('adminlogin')

def removeuser(request,email):
    print("removeuser++++++++++++")
    user = User.objects.get(email=email)
    authuser = authusers.objects.get(email=email)
    try:
        authuser.delete()
        user.delete()
    except:
        pass
    return redirect('adminpage')

def changevalid(request,id):
    print('changevalid_________')
    user = authusers.objects.get(email=id)
    if user.valid:
        user.valid=False
    else:
        user.valid=True
    user.save()
    return redirect('adminpage')



@login_required
def update_dark_mode(request):
    user = request.user
    new_dark_mode = request.POST.get('dark_mode', False)
    usersetting, created = usersettings.objects.get_or_create(user=user)
    new_dark_mode = False if usersetting.dark_mode else True
    usersetting.dark_mode = new_dark_mode
    usersetting.save()
    return JsonResponse({'success': True})


def editProfile(request,pk):
    if request.method == 'POST':
        user = User.objects.get(pk=pk)
        cover_image = request.FILES.get('coverimage')
        profile_image = request.FILES.get('profileimage')
        bio = request.POST.get('bio')
        branch = request.POST.get('branch')
        staff = request.POST.get('staff')
        print(branch,staff)
        fs = FileSystemStorage()
        if cover_image:
            old_cover = user.cover
            filename = fs.save(cover_image.name,cover_image)
            user.cover = fs.url(filename)
            if hasattr(old_cover,'path'):
                os.remove(os.path.join(settings.MEDIA_ROOT,old_cover.path))
        if profile_image:
            old_profile = user.profile_pic
            filename = fs.save(profile_image.name,profile_image)
            user.profile_pic = fs.url(filename)
            if hasattr(old_profile,'path'):
                os.remove(os.path.join(settings.MEDIA_ROOT,old_profile.path))
        if cover_image:
            user.cover = cover_image
        if profile_image:
            user.profile_pic = profile_image
        if bio:
            user.bio = bio
        if branch:
            user.branch = branch
        if staff:
            user.staff = staff
        user.save()
        return redirect('profile',username=user.username)

    return redirect('profile',username=user.username)

import time
from django.db.models import Q, Value
from django.db.models.functions import Concat

@csrf_exempt
def searchuser(request):
    if request.method == 'POST':
        username = json.loads(request.body)
        try:
            # userslist = User.objects.filter(first_name__icontains=username['username'],last_name__icontains=username['username'])
            # lastname = User.objects.filter(last_name__icontains=username['username'])
            # userslist = firstname | lastname
            # userslist = User.objects.annotate(full_name = Concat('first_name',Value(' '),'last_name')).filter(full_name__icontains=username)
            # print(userslist)
            # print(following)
            userslist = User.objects.filter(Q(first_name__icontains=username['username']) | Q(last_name__icontains=username['username']) | Q(username__icontains=username['username']) ).exclude(Q(pk=1) | Q(pk=request.user.pk)).distinct()
            following = Follower.objects.filter(user__in=userslist)
            uselist = list(userslist.values())
            d = dict()
            print(uselist)
            for i in range(len(following)):
                uselist[i]["is_following"] = request.user in following[i].followers.all()
                pass
            print(uselist)

            
            data = {"manoj":"manoj"}
            return JsonResponse({
                'success': True,
                'userslist' : list(uselist)
            })
        except Exception as e:
            print(e)
            pass
            
        
    return JsonResponse({
        'data' : "success"
    })
