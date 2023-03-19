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

from .models import *


def index(request):
    if request.user.is_anonymous:
        return redirect('login')
    # this code is to cheeck if the user is valid, if not the user is  made to logout of the site by admin
    if request.user.is_anonymous==False:
        if authusers.objects.filter(email=request.user.email).first().valid != True:
            messages.error(request, 'admin kicked you out')
            logout(request)


    all_posts = Post.objects.all().order_by('-date_created')
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
    user_mode = request.user.usersettings.dark_mode
    print(user_mode)
    return render(request, "network/index.html", {
        "posts": posts,
        "suggestions": suggestions,
        "page": "all_posts",
        'profile': False,
        'user_mode': user_mode
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
            else:
                user.profile_pic = "profile_pic/no_pic.png"
            user.cover = cover           
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
        suggestions = User.objects.exclude(pk__in=followings).exclude(username=request.user.username).order_by("?")[:6]

        if request.user in Follower.objects.get(user=user).followers.all():

            follower = True
        else:
            follower=False
    
    follower_count = Follower.objects.get(user=user).followers.all().count()
    following_count = Follower.objects.filter(followers=user).count()
    user_mode = request.user.usersettings.dark_mode
    return render(request, 'network/profile.html', {
        "username": user,
        "posts": posts,
        "posts_count": all_posts.count(),
        "suggestions": suggestions,
        "page": "profile",
        "is_follower": follower,
        "follower_count": follower_count,
        "following_count": following_count,
        'user_mode': user_mode

    })

def following(request):
    if request.user.is_authenticated:
        following_user = Follower.objects.filter(followers=request.user).values('user')
        all_posts = Post.objects.filter(creater__in=following_user).order_by('-date_created')
        paginator = Paginator(all_posts, 10)
        page_number = request.GET.get('page')
        if page_number == None:
            page_number = 1
        posts = paginator.get_page(page_number)
        followings = Follower.objects.filter(followers=request.user).values_list('user', flat=True)
        suggestions = User.objects.exclude(pk__in=followings).exclude(username=request.user.username).order_by("?")[:6]
        user_mode = request.user.usersettings.dark_mode
        return render(request, "network/index.html", {
            "posts": posts,
            "suggestions": suggestions,
            "page": "following",
            'user_mode': user_mode
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
    if request.user.is_authenticated:
        all_posts = Post.objects.filter(savers=request.user).order_by('-date_created')

        paginator = Paginator(all_posts, 10)
        page_number = request.GET.get('page')
        if page_number == None:
            page_number = 1
        posts = paginator.get_page(page_number)

        followings = Follower.objects.filter(followers=request.user).values_list('user', flat=True)
        suggestions = User.objects.exclude(pk__in=followings).exclude(username=request.user.username).order_by("?")[:6]
        user_mode = request.user.usersettings.dark_mode

        return render(request, "network/index.html", {
            "posts": posts,
            "suggestions": suggestions,
            "page": "saved",
            'profile': False,
            'user_mode': user_mode
        })
    else:
        return HttpResponseRedirect(reverse('login'))
        


@login_required
def create_post(request):
    if request.method == 'POST':
        text = request.POST.get('text')
        pic = request.FILES.get('picture')
        try:
            post = Post.objects.create(creater=request.user, content_text=text, content_image=pic)
            return HttpResponseRedirect(reverse('index'))
        except Exception as e:
            return HttpResponse(e)
    else:
        return HttpResponse("Method must be 'POST'")

@login_required
@csrf_exempt
def edit_post(request, post_id):
    if request.method == 'POST':
        text = request.POST.get('text')
        pic = request.FILES.get('picture')
        img_chg = request.POST.get('img_change')
        post_id = request.POST.get('id')
        post = Post.objects.get(id=post_id)
        try:
            post.content_text = text
            if img_chg != 'false':
                post.content_image = pic
            post.save()
            
            if(post.content_text):
                post_text = post.content_text
            else:
                post_text = False
            if(post.content_image):
                post_image = post.img_url()
            else:
                post_image = False
            
            return JsonResponse({
                "success": True,
                "text": post_text,
                "picture": post_image
            })
        except Exception as e:
            print('-----------------------------------------------')
            print(e)
            print('-----------------------------------------------')
            return JsonResponse({
                "success": False
            })
    else:
            return HttpResponse("Method must be 'POST'")

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
        if request.method == 'PUT':
            post = Post.objects.get(id=post_id)
            if request.user == post.creater:
                try:
                    delet = post.delete()
                    return HttpResponse(status=201)
                except Exception as e:
                    return HttpResponse(e)
            else:
                return HttpResponse(status=404)
        else:
            return HttpResponse("Method must be 'PUT'")
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
    return render(request,'network/admin.html',{
        'users':authusers.objects.values().exclude(user='adminsuper').order_by('-date_created')
    })


def adminlogout(request):
    logout(request)
    return redirect('adminlogin')

def removeuser(request,email):
    print("removeuser++++++++++++")
    user = authusers.objects.get(email=email)
    user.delete()
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