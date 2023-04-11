
// document.addEventListener('DOMContentLoaded', () => {
//     let active = document.querySelector('.body').dataset.page;
//     document.querySelector("#"+active).classList.add('active');
// });

function drop_down(event) {
    let drop_down = event.target.parentElement.querySelector(".dropdown-menu");
    setTimeout(() => {
        drop_down.style.display = 'block';
        width = drop_down.offsetWidth;
        let btn_width = drop_down.parentElement.querySelector('button').offsetWidth;
        let left = width-btn_width;
        drop_down.style.left = '-'+left+'px';
        document.addEventListener('keydown', event => {
            if(event.key === 'Escape') {
                drop_down.style.display = 'none';
            }
        });
    }, 100);
}

function remove_drop_down(event) {
    setTimeout(() => {
        event.target.parentElement.querySelector(".dropdown-menu").style.display = 'none';
    },250);
}

function createpost() {
    let popup = document.querySelector(".popup");
    popup.style.display = 'block';
    popup.querySelector('.large-popup').style.display = 'block'
    document.querySelector('.body').setAttribute('aria-hidden', 'true');
    document.querySelector('body').style.overflow = "hidden";
    document.querySelector('#insert-img').onchange = previewFile;
    popup.querySelector('.large-popup').querySelector('form').setAttribute('onsubmit', '');
    popup.querySelector('.large-popup').querySelector("#post-text").addEventListener('input', (event) => {
        if(event.target.value.trim().length > 0) {
            popup.querySelector('.submit-btn').disabled = false;
        }
        else if(event.target.parentElement.querySelector('#img-div').style.backgroundImage) {
            popup.querySelector('.submit-btn').disabled = false;
        }
        else {
            popup.querySelector('.submit-btn').disabled = true;
        }
    });
}

function confirm_delete(id) {
    let popup = document.querySelector('.popup');
    popup.style.display = 'block';
    let small_popup = popup.querySelector('.small-popup');
    small_popup.style.display = 'block';
    document.querySelector('.body').setAttribute('aria-hidden', 'true');
    document.querySelector('body').style.overflow = "hidden";
    small_popup.querySelector('#delete_post_btn').setAttribute('onclick', `delete_post(${id})`);
}

function delete_post(id) {
    remove_popup();
    setTimeout(() => {
        let post = 0;
        document.querySelectorAll('.post').forEach(eachpost => {
            if(eachpost.dataset.post_id==id) {
                post = eachpost;
            }
        });
        post.style.animationPlayState = 'running';
        post.addEventListener('animationend', () => {
            post.remove();
        });
        fetch('/n/post/'+parseInt(id)+'/delete', {
            method: 'PUT'
        });
    },200);
}

function edit_post(element) {
    let post = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
    let popup = document.querySelector('.large-popup');
    let promise = new Promise((resolve, reject) => {
        let post_text = post.querySelector('.post-content').innerText;
        let post_image = post.querySelector('.post-image').style.backgroundImage;

        popup.querySelector('#post-text').value = post_text;
        if(post_image) {
            popup.querySelector('#img-div').style.backgroundImage = post_image;
            document.querySelector('#del-img').addEventListener('click', del_image);
            popup.querySelector('#img-div').style.display = 'block';
        }
        else {
            popup.querySelector('#img-div').style.backgroundImage = '';
        }
        resolve(popup);
    });
    promise.then(() => {
        createpost();
        popup.querySelector('form').setAttribute('onsubmit', `return edit_post_submit(${post.dataset.post_id})`);
        popup.querySelector('.submit-btn').disabled = false;
    });
}
function edit_post_submit(post_id) {
    let popup = document.querySelector('.large-popup');
    let text = popup.querySelector('#post-text').value;
    let pic = popup.querySelector('#insert-img');
    let chg = popup.querySelector('#img-change');
    let formdata = new FormData();
    formdata.append('text',text);
    formdata.append('picture',pic.files[0]);
    formdata.append('img_change', chg.value);
    formdata.append('id',post_id);
    fetch('/n/post/'+parseInt(post_id)+'/edit', {
        method:'POST',
        body: formdata
    })
    .then(response => response.json())
    .then(response => {
        if(response.success) {
            let posts = document.querySelectorAll('.post');
            posts.forEach(post => {
                if(parseInt(post.dataset.post_id) === parseInt(post_id)) {
                    if(response.text) {
                        post.querySelector('.post-content').innerText = response.text;
                    }
                    else {
                        post.querySelector('.post-content').innerText = "";
                    }
                    if(response.picture) {
                        post.querySelector('.post-image').style.backgroundImage = `url(${response.picture})`;
                        post.querySelector('.post-image').style.display = 'block';
                    }
                    else {
                        post.querySelector('.post-image').style.backgroundImage = '';
                        post.querySelector('.post-image').style.display = 'none';
                    }
                }
            });
            return false;
        }
        else {
            console.log('There was an error while editing the post.');
        }
    });
    remove_popup();
    return false;
}

function remove_popup() {
    let popup = document.querySelector('.popup');
    popup.style.display = 'none';
    document.querySelector('.body').style.marginRight = '0px';
    document.querySelector('.body').setAttribute('aria-hidden', 'false');
    document.querySelector('body').style.overflow = "auto";
    let small_popup = document.querySelector('.small-popup');
    let large_popup = document.querySelector('.large-popup');
    let login_popup = document.querySelector('.login-popup');
    small_popup.style.display = 'none';
    large_popup.style.display = 'none';
    login_popup.style.display = 'none';
    large_popup.querySelector('#post-text').value = '';
    large_popup.querySelector('#insert-img').value = '';
    large_popup.querySelector('#img-div').style.backgroundImage = '';
    large_popup.querySelector('#img-change').value = 'false';
    large_popup.querySelector('#img-div').style.display = 'none';
}

function login_popup(action) {
    let popup = document.querySelector('.popup');
    popup.style.display = 'block';
    popup.querySelector('.login-popup').style.display = 'block';
    document.querySelector('.body').setAttribute('aria-hidden', 'true');
    document.querySelector('body').style.overflow = "hidden";
    if(action === 'like') {
        document.querySelector('.icon-div').innerHTML = `
        <svg width="2.5em" height="2.5em" viewBox="0 0 16 16" class="bi bi-heart-fill" fill="#e0245e" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
        </svg>`;
        document.querySelector('.main_text-div').querySelector('h2').innerText = 'Like a post to share the love';
    }
    else if(action === 'comment') {
        document.querySelector('.icon-div').innerHTML = `
        <svg width="2.5em" height="2.5em" viewBox="0 0 16 16" class="bi bi-chat-fill" fill="#1da1f2" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
        </svg>`;
        document.querySelector('.main_text-div').querySelector('h2').innerText = 'Comment to join the conversation';
    }
    else if(action === 'save') {
        document.querySelector('.icon-div').innerHTML = `
        <svg width="2.5em" height="2.5em" viewBox="0 0 16 16" class="bi bi-bookmark-fill" fill="#17bf63" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M3 3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12l-5-3-5 3V3z"/>
        </svg>`;
        document.querySelector('.main_text-div').querySelector('h2').innerText = 'Save a post to reference later';
    }
    else if (action === 'follow') {
        document.querySelector('.icon-div').innerHTML = `
        <svg width="2.5em" height="2.5em" viewBox="0 0 24 24" fill="#17bf63" class="r-1re7ezh r-4qtqp9 r-yyyyoo r-1q142lx r-1xvli5t r-19einr3 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr">
            <g><path d="M23.152 3.483h-2.675V.81c0-.415-.336-.75-.75-.75s-.75.335-.75.75v2.674H16.3c-.413 0-.75.336-.75.75s.337.75.75.75h2.677V7.66c0 .413.336.75.75.75s.75-.337.75-.75V4.982h2.675c.414 0 .75-.336.75-.75s-.336-.75-.75-.75zM8.417 11.816c1.355 0 2.872-.15 3.84-1.256.813-.93 1.077-2.367.806-4.392-.38-2.826-2.116-4.513-4.646-4.513S4.15 3.342 3.77 6.168c-.27 2.025-.007 3.462.807 4.393.968 1.108 2.485 1.257 3.84 1.257zm-3.16-5.448c.16-1.2.786-3.212 3.16-3.212 2.373 0 2.998 2.013 3.16 3.212.207 1.55.056 2.627-.45 3.205-.455.52-1.266.743-2.71.743s-2.256-.223-2.71-.743c-.507-.578-.658-1.656-.45-3.205zm11.44 12.867c-.88-3.525-4.283-5.988-8.28-5.988-3.998 0-7.403 2.463-8.28 5.988-.172.693-.03 1.4.395 1.94.408.522 1.04.822 1.733.822H14.57c.69 0 1.323-.3 1.73-.82.425-.54.568-1.247.396-1.942zm-1.577 1.018c-.126.16-.316.245-.55.245H2.264c-.235 0-.426-.085-.552-.246-.137-.174-.18-.412-.12-.654.71-2.855 3.517-4.85 6.824-4.85s6.113 1.994 6.824 4.85c.06.24.017.48-.12.655z"></path></g>
        </svg>`;
        document.querySelector('.main_text-div').querySelector('h2').innerText = 'Follow people that inspires you';
    }
}


function previewFile() {
    document.querySelector('#img-div').style.display = 'block';
    document.querySelector('#spinner').style.display = 'block';
    document.querySelector('#del-img').style.display = 'none';
    document.querySelector('#del-img').addEventListener('click', del_image);
    var preview = document.querySelector('#img-div');
    var file    = document.querySelector('input[type=file]').files[0];
    var reader  = new FileReader();
    
    reader.onloadend = function () {
        preview.style.backgroundImage = `url(${reader.result})`;
        document.querySelector('.large-popup').querySelector('#img-change').value = 'true';
    }

    if (file) {
        //reader.addEventListener('progress', (event) => {
        //    document.querySelector('#spinner').style.display = 'block';
        //});
        document.querySelector('.form-action-btns').querySelector('input[type=submit]').disabled = false;
        var promise = new Promise(function(resolve, reject){
            setTimeout(() => {
                var read = reader.readAsDataURL(file);
                resolve(read);
            },500);
        });
        promise 
            .then(function () { 
                document.querySelector('#spinner').style.display = 'none';
                document.querySelector('#del-img').style.display = 'block';
            })
            .catch(function () { 
                console.log('Some error has occured'); 
            });
        
    }
    else {
        document.querySelector('#spinner').style.display = 'none';
        document.querySelector('#del-img').style.display = 'block';
    }
}

function del_image() {
    document.querySelector('input[type=file]').value = '';
    document.querySelector('#img-div').style.backgroundImage = '';
    document.querySelector('#img-div').style.display = 'none';
    document.querySelector('.large-popup').querySelector('#img-change').value = 'true';
    if(document.querySelector('.large-popup').querySelector('#post-text').value.trim().length <= 0) {
        document.querySelector('.large-popup').querySelector('.form-action-btns').querySelector('input[type=submit]').disabled = true;
    }
}

function like_post(element) {
  element.classList.add('pointer-events-none');
    if(document.querySelector('#user_is_authenticated').value === 'False') {
        login_popup('like');
        return false;
    }
    let id = element.dataset.post_id;
    fetch('/n/post/'+parseInt(id)+'/like', {
        method: 'PUT'
    })
      .then(() => {
        element.classList.remove('pointer-events-none');

        let count = element.querySelector('.likes_count');
        let value = count.innerHTML;
        value++;
        count.innerHTML = value;
        element.querySelector('.svg-span').innerHTML = `
            <svg width="1.1em" height="1.1em" viewBox="0 -1 16 16" class="bi bi-heart-fill hover:scale-110 transition-all ease-in-out" fill="#e0245e" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
            </svg>`;
        element.setAttribute('onclick','unlike_post(this)');
    })
}

function unlike_post(element) {

        element.classList.add('pointer-events-none');

    let id = element.dataset.post_id;
    fetch('/n/post/'+parseInt(id)+'/unlike', {
        method: 'PUT'
    })
      .then(() => {
        element.classList.remove('pointer-events-none');
        let count = element.querySelector('.likes_count');
        let value = count.innerHTML;
        value--;
        count.innerHTML = value;
        element.querySelector('.svg-span').innerHTML = `
            <svg width="1.1em" height="1.1em" viewBox="0 -1 16 16" class="bi bi-heart hover:scale-110 transition-all ease-in-out" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
            </svg>`;
        element.setAttribute('onclick','like_post(this)');
    })
}

function save_post(element) {
    if(document.querySelector('#user_is_authenticated').value === 'False') {
        login_popup('save');
        return false;
    }
    let id = element.dataset.post_id;
    fetch('/n/post/'+parseInt(id)+'/save', {
        method: 'PUT'
    })
    .then(() => {
        element.querySelector('.svg-span').innerHTML = `
            <svg width="1.1em" height="1.1em" viewBox="0.5 0 15 15" class="bi bi-bookmark-fill" fill="#17bf63" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M3 3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12l-5-3-5 3V3z"/>
            </svg>`;
        element.setAttribute('onclick','unsave_post(this)');
    });
}

function unsave_post(element) {
    let id = element.dataset.post_id;
    fetch('/n/post/'+parseInt(id)+'/unsave', {
        method: 'PUT'
    })
    .then(() => {
        element.querySelector('.svg-span').innerHTML = `
        <svg width="1.1em" height="1.1em" viewBox="0.5 0 15 15" class="bi bi-bookmark" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M8 12l5 3V3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12l5-3zm-4 1.234l4-2.4 4 2.4V3a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10.234z"/>
        </svg>`;
        element.setAttribute('onclick','save_post(this)');
    });
}


function follow_user(element, username, origin) {
    if(document.querySelector('#user_is_authenticated').value === 'False') {
        login_popup('follow');
        return false;
    }
   
    fetch('/'+username+'/follow', {
        method: 'PUT'
    })
    .then(() => {
        if(origin === 'suggestion') {
            element.parentElement.innerHTML = `<button class="btn btn-success  bg-purple-400 px-4 py-[2px] text-sm mt-2 mr-3 font-semibold text-black rounded-full" type="button" onclick="unfollow_user(this,'${username}','suggestion')">Unfollow</button>`;
        }
        else if(origin === 'edit_page') {
            element.parentElement.innerHTML = `<button class="btn btn-success float-right  bg-purple-400 px-4 py-[2px] text-sm mt-2 mr-3 font-semibold text-black rounded-full" onclick="unfollow_user(this,'${username}','edit_page')" id="following-btn">Unfollow</button>`;
        }
        else if(origin === 'dropdown') {
            ////////////////////////////////////////////////////////////////////////////////////////////
        }

        if(document.querySelector('.body').dataset.page === 'profile') {
            if(document.querySelector('.profile-view').dataset.user === username) {
                document.querySelector('#follower__count').innerHTML++;
            }
        }
        if(document.querySelector('.body').dataset.page === 'profile') {
            if(document.querySelector('.profile-view').dataset.user === document.querySelector('#user_is_authenticated').dataset.username) {
                document.querySelector('#following__count').innerHTML++;
            }
        }
    });
}

function unfollow_user(element, username, origin) {
    if(document.querySelector('#user_is_authenticated').value === 'False') {
        login_popup('follow');
        return false;
    }
    fetch('/'+username+'/unfollow', {
        method: 'PUT'
    })
    .then(() => {
        if(origin === 'suggestion') {
            element.parentElement.innerHTML = `<button class="btn btn-outline-success  bg-purple-400 px-4 py-[2px] text-sm mt-2 mr-3 font-semibold text-black rounded-full" type="button" onclick="follow_user(this,'${username}','suggestion')">Follow</button>`;
        }
        else if(origin === 'edit_page') {
            element.parentElement.innerHTML = `<button class="btn btn-outline-success float-right  bg-purple-400 px-4 py-[2px] text-sm mt-2 mr-3 font-semibold text-black rounded-full" onclick="follow_user(this,'${username}','edit_page')" id="follow-btn">Follow</button>`;
        }
        else if(origin === 'dropdown') {
            ///////////////////////////////////////////////////////////////////////////////////////////
        }

        if(document.querySelector('.body').dataset.page === 'profile') {
            if(document.querySelector('.profile-view').dataset.user === username) {
                document.querySelector('#follower__count').innerHTML--;
            }
        }
        if(document.querySelector('.body').dataset.page === 'profile') {
            if(document.querySelector('.profile-view').dataset.user === document.querySelector('#user_is_authenticated').dataset.username) {
                document.querySelector('#following__count').innerHTML--;
            }
        }
    });
}


function show_comment(element) {
    if(document.querySelector('#user_is_authenticated').value === 'False') {
        login_popup('comment');
        return;
    }
  let post_div = element.parentElement.parentElement.parentElement.parentElement.parentElement;
  console.log(post_div.dataset.post_id)
    let post_id = post_div.dataset.post_id;
    let comment_div = post_div.querySelector('.comment-div');
    let comment_div_data = comment_div.querySelector('.comment-div-data');
    let comment_comments = comment_div_data.querySelector('.comment-comments');
    if(comment_div.style.display === 'block') {
        comment_div.querySelector('input').focus()
        return;
    }
    comment_div.querySelector('#spinner').style.display = 'block';
    comment_div.style.display = 'block';
    fetch('/n/post/'+parseInt(post_id)+'/comments')
    .then(response => response.json())
    .then(comments => {
        comments.forEach(comment => {
            display_comment(comment,comment_comments);
        });
    })
    .then(() => {
        setTimeout(() => {
            comment_div.querySelector('.spinner-div').style.display = 'none';
            comment_div.querySelector('.comment-div-data').style.display = 'block';
            comment_div.style.overflow = 'auto';
        }, 500);
    });
}

function write_comment(element) {
    let post_id = element.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.post_id;
    let comment_text = element.querySelector('.comment-input').value;
    let comment_comments = element.parentElement.parentElement.parentElement.parentElement.querySelector('.comment-comments');
    let comment_count = comment_comments.parentElement.parentElement.parentElement.querySelector('.cmt-count');
    if(comment_text.trim().length <= 0) {
        return false;
    }
    fetch('/n/post/'+parseInt(post_id)+'/write_comment',{
        method: 'POST',
        body: JSON.stringify({
            comment_text: comment_text
        })
    })
    .then(response => response.json())
    .then(comment => {f
        console.log(comment);
        element.querySelector('input').value = '';
        comment_count.innerHTML++;
        display_comment(comment[0],comment_comments,true);
        return false;
    });
    return false;
}

function display_comment(comment, container, new_comment=false) {
    let writer = document.querySelector('#user_is_authenticated').dataset.username;
    let eachrow = document.createElement('div');
    eachrow.className = 'eachrow';
    eachrow.setAttribute('data-id', comment.id);
    eachrow.innerHTML = `
        <div>
            <a href='/${comment.commenter.username}'>
                <div class="small-profilepic" style="background-image: url(${comment.commenter.profile_pic})"></div>
            </a>
        </div>
        <div style="flex: 1;">
            <div class="comment-text-div">
                <div class="comment-user">
                    <a href="/${comment.commenter.username}">
                        ${comment.commenter.first_name} ${comment.commenter.last_name}
                    </a>
                </div>
                ${comment.body}
            </div>
        </div>
        
        <div class="flex justify-start items-center  w-fit px-2 py-2 rounded" >
            <div class="">
                <a href='/${comment.commenter.username}'>
                    <div class="small-profilepic bg-cover bg-center rounded-full h-11 w-11" style="background-image: url(${comment.commenter.profile_pic})"></div>
                </a>
            </div>
            <div>
                <div class="comment-text-div px-2 flex flex-col justify-start ">
                    <div class="comment-user inline">
                        <a href="/${comment.commenter.username}" class="inline font-bold text-white hover:opacity-90 text-sm " >
                            ${comment.commenter.first_name} ${comment.commenter.last_name}
                        </a>
                    </div>
                    <div class=" text-sm  text-gray-400 ">
                    ${comment.body}
                    </div>
                </div>
            </div>
        </div>
        `;
    if (new_comment) {
        eachrow.classList.add('godown');
        let comments = container.innerHTML;
        container.prepend(eachrow);
    }
    else {
        container.append(eachrow);
    }
}






function goto_register() {
    window.location.href = '/n/register';
}

function goto_login() {
    window.location.href = '/n/login';
}




/** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [],
//   presets: [],
//   darkMode: ['class', '[data-mode="dark"]'], // or 'class'
//     theme: {
//         extend: {
//             colors: {
//                 'soc':"#99c0ff"
//             }
//         },
//     screens: {
//       sm: '640px',
//       md: '768px',
//       lg: '1024px',
//       xl: '1280px',
//       '2xl': '1536px',
//     },
//     colors: ({ colors }) => ({
//       inherit: colors.inherit,
//       current: colors.current,
//       transparent: colors.transparent,
//       black: colors.black,
//       white: colors.white,
//       slate: colors.slate,
//       gray: colors.gray,
//       zinc: colors.zinc,
//       neutral: colors.neutral,
//       stone: colors.stone,
//       red: colors.red,
//       orange: colors.orange,
//       amber: colors.amber,
//       yellow: colors.yellow,
//       lime: colors.lime,
//       green: colors.green,
//       emerald: colors.emerald,
//       teal: colors.teal,
//       cyan: colors.cyan,
//       sky: colors.sky,
//       blue: colors.blue,
//       indigo: colors.indigo,
//       violet: colors.violet,
//       purple: colors.purple,
//       fuchsia: colors.fuchsia,
//       pink: colors.pink,
//       rose: colors.rose,
//     }),
//     columns: {
//       auto: 'auto',
//       1: '1',
//       2: '2',
//       3: '3',
//       4: '4',
//       5: '5',
//       6: '6',
//       7: '7',
//       8: '8',
//       9: '9',
//       10: '10',
//       11: '11',
//       12: '12',
//       '3xs': '16rem',
//       '2xs': '18rem',
//       xs: '20rem',
//       sm: '24rem',
//       md: '28rem',
//       lg: '32rem',
//       xl: '36rem',
//       '2xl': '42rem',
//       '3xl': '48rem',
//       '4xl': '56rem',
//       '5xl': '64rem',
//       '6xl': '72rem',
//       '7xl': '80rem',
//     },
//     spacing: {
//       px: '1px',
//       0: '0px',
//       0.5: '0.125rem',
//       1: '0.25rem',
//       1.5: '0.375rem',
//       2: '0.5rem',
//       2.5: '0.625rem',
//       3: '0.75rem',
//       3.5: '0.875rem',
//       4: '1rem',
//       5: '1.25rem',
//       6: '1.5rem',
//       7: '1.75rem',
//       8: '2rem',
//       9: '2.25rem',
//       10: '2.5rem',
//       11: '2.75rem',
//       12: '3rem',
//       14: '3.5rem',
//       16: '4rem',
//       20: '5rem',
//       24: '6rem',
//       28: '7rem',
//       32: '8rem',
//       36: '9rem',
//       40: '10rem',
//       44: '11rem',
//       48: '12rem',
//       52: '13rem',
//       56: '14rem',
//       60: '15rem',
//       64: '16rem',
//       72: '18rem',
//       80: '20rem',
//       96: '24rem',
//     },
//     animation: {
//       none: 'none',
//       spin: 'spin 1s linear infinite',
//       ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
//       pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//       bounce: 'bounce 1s infinite',
//     },
//     aspectRatio: {
//       auto: 'auto',
//       square: '1 / 1',
//       video: '16 / 9',
//     },
//     backdropBlur: ({ theme }) => theme('blur'),
//     backdropBrightness: ({ theme }) => theme('brightness'),
//     backdropContrast: ({ theme }) => theme('contrast'),
//     backdropGrayscale: ({ theme }) => theme('grayscale'),
//     backdropHueRotate: ({ theme }) => theme('hueRotate'),
//     backdropInvert: ({ theme }) => theme('invert'),
//     backdropOpacity: ({ theme }) => theme('opacity'),
//     backdropSaturate: ({ theme }) => theme('saturate'),
//     backdropSepia: ({ theme }) => theme('sepia'),
//     backgroundColor: ({ theme }) => theme('colors'),
//     backgroundImage: {
//       none: 'none',
//       'gradient-to-t': 'linear-gradient(to top, var(--tw-gradient-stops))',
//       'gradient-to-tr': 'linear-gradient(to top right, var(--tw-gradient-stops))',
//       'gradient-to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
//       'gradient-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
//       'gradient-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
//       'gradient-to-bl': 'linear-gradient(to bottom left, var(--tw-gradient-stops))',
//       'gradient-to-l': 'linear-gradient(to left, var(--tw-gradient-stops))',
//       'gradient-to-tl': 'linear-gradient(to top left, var(--tw-gradient-stops))',
//     },
//     backgroundOpacity: ({ theme }) => theme('opacity'),
//     backgroundPosition: {
//       bottom: 'bottom',
//       center: 'center',
//       left: 'left',
//       'left-bottom': 'left bottom',
//       'left-top': 'left top',
//       right: 'right',
//       'right-bottom': 'right bottom',
//       'right-top': 'right top',
//       top: 'top',
//     },
//     backgroundSize: {
//       auto: 'auto',
//       cover: 'cover',
//       contain: 'contain',
//     },
//     blur: {
//       0: '0',
//       none: '0',
//       sm: '4px',
//       DEFAULT: '8px',
//       md: '12px',
//       lg: '16px',
//       xl: '24px',
//       '2xl': '40px',
//       '3xl': '64px',
//     },
//     brightness: {
//       0: '0',
//       50: '.5',
//       75: '.75',
//       90: '.9',
//       95: '.95',
//       100: '1',
//       105: '1.05',
//       110: '1.1',
//       125: '1.25',
//       150: '1.5',
//       200: '2',
//     },
//     borderColor: ({ theme }) => ({
//       ...theme('colors'),
//       DEFAULT: theme('colors.gray.200', 'currentColor'),
//     }),
//     borderOpacity: ({ theme }) => theme('opacity'),
//     borderRadius: {
//       none: '0px',
//       sm: '0.125rem',
//       DEFAULT: '0.25rem',
//       md: '0.375rem',
//       lg: '0.5rem',
//       xl: '0.75rem',
//       '2xl': '1rem',
//       '3xl': '1.5rem',
//       full: '9999px',
//     },
//     borderSpacing: ({ theme }) => ({
//       ...theme('spacing'),
//     }),
//     borderWidth: {
//       DEFAULT: '1px',
//       0: '0px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     boxShadow: {
//       sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
//       DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
//       md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
//       lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
//       xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
//       '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
//       inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
//       none: 'none',
//     },
//     boxShadowColor: ({ theme }) => theme('colors'),
//     caretColor: ({ theme }) => theme('colors'),
//     accentColor: ({ theme }) => ({
//       ...theme('colors'),
//       auto: 'auto',
//     }),
//     contrast: {
//       0: '0',
//       50: '.5',
//       75: '.75',
//       100: '1',
//       125: '1.25',
//       150: '1.5',
//       200: '2',
//     },
//     container: {},
//     content: {
//       none: 'none',
//     },
//     cursor: {
//       auto: 'auto',
//       default: 'default',
//       pointer: 'pointer',
//       wait: 'wait',
//       text: 'text',
//       move: 'move',
//       help: 'help',
//       'not-allowed': 'not-allowed',
//       none: 'none',
//       'context-menu': 'context-menu',
//       progress: 'progress',
//       cell: 'cell',
//       crosshair: 'crosshair',
//       'vertical-text': 'vertical-text',
//       alias: 'alias',
//       copy: 'copy',
//       'no-drop': 'no-drop',
//       grab: 'grab',
//       grabbing: 'grabbing',
//       'all-scroll': 'all-scroll',
//       'col-resize': 'col-resize',
//       'row-resize': 'row-resize',
//       'n-resize': 'n-resize',
//       'e-resize': 'e-resize',
//       's-resize': 's-resize',
//       'w-resize': 'w-resize',
//       'ne-resize': 'ne-resize',
//       'nw-resize': 'nw-resize',
//       'se-resize': 'se-resize',
//       'sw-resize': 'sw-resize',
//       'ew-resize': 'ew-resize',
//       'ns-resize': 'ns-resize',
//       'nesw-resize': 'nesw-resize',
//       'nwse-resize': 'nwse-resize',
//       'zoom-in': 'zoom-in',
//       'zoom-out': 'zoom-out',
//     },
//     divideColor: ({ theme }) => theme('borderColor'),
//     divideOpacity: ({ theme }) => theme('borderOpacity'),
//     divideWidth: ({ theme }) => theme('borderWidth'),
//     dropShadow: {
//       sm: '0 1px 1px rgb(0 0 0 / 0.05)',
//       DEFAULT: ['0 1px 2px rgb(0 0 0 / 0.1)', '0 1px 1px rgb(0 0 0 / 0.06)'],
//       md: ['0 4px 3px rgb(0 0 0 / 0.07)', '0 2px 2px rgb(0 0 0 / 0.06)'],
//       lg: ['0 10px 8px rgb(0 0 0 / 0.04)', '0 4px 3px rgb(0 0 0 / 0.1)'],
//       xl: ['0 20px 13px rgb(0 0 0 / 0.03)', '0 8px 5px rgb(0 0 0 / 0.08)'],
//       '2xl': '0 25px 25px rgb(0 0 0 / 0.15)',
//       none: '0 0 #0000',
//     },
//     fill: ({ theme }) => theme('colors'),
//     grayscale: {
//       0: '0',
//       DEFAULT: '100%',
//     },
//     hueRotate: {
//       0: '0deg',
//       15: '15deg',
//       30: '30deg',
//       60: '60deg',
//       90: '90deg',
//       180: '180deg',
//     },
//     invert: {
//       0: '0',
//       DEFAULT: '100%',
//     },
//     flex: {
//       1: '1 1 0%',
//       auto: '1 1 auto',
//       initial: '0 1 auto',
//       none: 'none',
//     },
//     flexBasis: ({ theme }) => ({
//       auto: 'auto',
//       ...theme('spacing'),
//       '1/2': '50%',
//       '1/3': '33.333333%',
//       '2/3': '66.666667%',
//       '1/4': '25%',
//       '2/4': '50%',
//       '3/4': '75%',
//       '1/5': '20%',
//       '2/5': '40%',
//       '3/5': '60%',
//       '4/5': '80%',
//       '1/6': '16.666667%',
//       '2/6': '33.333333%',
//       '3/6': '50%',
//       '4/6': '66.666667%',
//       '5/6': '83.333333%',
//       '1/12': '8.333333%',
//       '2/12': '16.666667%',
//       '3/12': '25%',
//       '4/12': '33.333333%',
//       '5/12': '41.666667%',
//       '6/12': '50%',
//       '7/12': '58.333333%',
//       '8/12': '66.666667%',
//       '9/12': '75%',
//       '10/12': '83.333333%',
//       '11/12': '91.666667%',
//       full: '100%',
//     }),
//     flexGrow: {
//       0: '0',
//       DEFAULT: '1',
//     },
//     flexShrink: {
//       0: '0',
//       DEFAULT: '1',
//     },
//     fontFamily: {
//       sans: [
//         'ui-sans-serif',
//         'system-ui',
//         '-apple-system',
//         'BlinkMacSystemFont',
//         '"Segoe UI"',
//         'Roboto',
//         '"Helvetica Neue"',
//         'Arial',
//         '"Noto Sans"',
//         'sans-serif',
//         '"Apple Color Emoji"',
//         '"Segoe UI Emoji"',
//         '"Segoe UI Symbol"',
//         '"Noto Color Emoji"',
//       ],
//       serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
//       mono: [
//         'ui-monospace',
//         'SFMono-Regular',
//         'Menlo',
//         'Monaco',
//         'Consolas',
//         '"Liberation Mono"',
//         '"Courier New"',
//         'monospace',
//       ],
//     },
//     fontSize: {
//       xs: ['0.75rem', { lineHeight: '1rem' }],
//       sm: ['0.875rem', { lineHeight: '1.25rem' }],
//       base: ['1rem', { lineHeight: '1.5rem' }],
//       lg: ['1.125rem', { lineHeight: '1.75rem' }],
//       xl: ['1.25rem', { lineHeight: '1.75rem' }],
//       '2xl': ['1.5rem', { lineHeight: '2rem' }],
//       '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
//       '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
//       '5xl': ['3rem', { lineHeight: '1' }],
//       '6xl': ['3.75rem', { lineHeight: '1' }],
//       '7xl': ['4.5rem', { lineHeight: '1' }],
//       '8xl': ['6rem', { lineHeight: '1' }],
//       '9xl': ['8rem', { lineHeight: '1' }],
//     },
//     fontWeight: {
//       thin: '100',
//       extralight: '200',
//       light: '300',
//       normal: '400',
//       medium: '500',
//       semibold: '600',
//       bold: '700',
//       extrabold: '800',
//       black: '900',
//     },
//     gap: ({ theme }) => theme('spacing'),
//     gradientColorStops: ({ theme }) => theme('colors'),
//     gridAutoColumns: {
//       auto: 'auto',
//       min: 'min-content',
//       max: 'max-content',
//       fr: 'minmax(0, 1fr)',
//     },
//     gridAutoRows: {
//       auto: 'auto',
//       min: 'min-content',
//       max: 'max-content',
//       fr: 'minmax(0, 1fr)',
//     },
//     gridColumn: {
//       auto: 'auto',
//       'span-1': 'span 1 / span 1',
//       'span-2': 'span 2 / span 2',
//       'span-3': 'span 3 / span 3',
//       'span-4': 'span 4 / span 4',
//       'span-5': 'span 5 / span 5',
//       'span-6': 'span 6 / span 6',
//       'span-7': 'span 7 / span 7',
//       'span-8': 'span 8 / span 8',
//       'span-9': 'span 9 / span 9',
//       'span-10': 'span 10 / span 10',
//       'span-11': 'span 11 / span 11',
//       'span-12': 'span 12 / span 12',
//       'span-full': '1 / -1',
//     },
//     gridColumnEnd: {
//       auto: 'auto',
//       1: '1',
//       2: '2',
//       3: '3',
//       4: '4',
//       5: '5',
//       6: '6',
//       7: '7',
//       8: '8',
//       9: '9',
//       10: '10',
//       11: '11',
//       12: '12',
//       13: '13',
//     },
//     gridColumnStart: {
//       auto: 'auto',
//       1: '1',
//       2: '2',
//       3: '3',
//       4: '4',
//       5: '5',
//       6: '6',
//       7: '7',
//       8: '8',
//       9: '9',
//       10: '10',
//       11: '11',
//       12: '12',
//       13: '13',
//     },
//     gridRow: {
//       auto: 'auto',
//       'span-1': 'span 1 / span 1',
//       'span-2': 'span 2 / span 2',
//       'span-3': 'span 3 / span 3',
//       'span-4': 'span 4 / span 4',
//       'span-5': 'span 5 / span 5',
//       'span-6': 'span 6 / span 6',
//       'span-full': '1 / -1',
//     },
//     gridRowStart: {
//       auto: 'auto',
//       1: '1',
//       2: '2',
//       3: '3',
//       4: '4',
//       5: '5',
//       6: '6',
//       7: '7',
//     },
//     gridRowEnd: {
//       auto: 'auto',
//       1: '1',
//       2: '2',
//       3: '3',
//       4: '4',
//       5: '5',
//       6: '6',
//       7: '7',
//     },
//     gridTemplateColumns: {
//       none: 'none',
//       1: 'repeat(1, minmax(0, 1fr))',
//       2: 'repeat(2, minmax(0, 1fr))',
//       3: 'repeat(3, minmax(0, 1fr))',
//       4: 'repeat(4, minmax(0, 1fr))',
//       5: 'repeat(5, minmax(0, 1fr))',
//       6: 'repeat(6, minmax(0, 1fr))',
//       7: 'repeat(7, minmax(0, 1fr))',
//       8: 'repeat(8, minmax(0, 1fr))',
//       9: 'repeat(9, minmax(0, 1fr))',
//       10: 'repeat(10, minmax(0, 1fr))',
//       11: 'repeat(11, minmax(0, 1fr))',
//       12: 'repeat(12, minmax(0, 1fr))',
//     },
//     gridTemplateRows: {
//       none: 'none',
//       1: 'repeat(1, minmax(0, 1fr))',
//       2: 'repeat(2, minmax(0, 1fr))',
//       3: 'repeat(3, minmax(0, 1fr))',
//       4: 'repeat(4, minmax(0, 1fr))',
//       5: 'repeat(5, minmax(0, 1fr))',
//       6: 'repeat(6, minmax(0, 1fr))',
//     },
//     height: ({ theme }) => ({
//       auto: 'auto',
//       ...theme('spacing'),
//       '1/2': '50%',
//       '1/3': '33.333333%',
//       '2/3': '66.666667%',
//       '1/4': '25%',
//       '2/4': '50%',
//       '3/4': '75%',
//       '1/5': '20%',
//       '2/5': '40%',
//       '3/5': '60%',
//       '4/5': '80%',
//       '1/6': '16.666667%',
//       '2/6': '33.333333%',
//       '3/6': '50%',
//       '4/6': '66.666667%',
//       '5/6': '83.333333%',
//       full: '100%',
//       screen: '100vh',
//       min: 'min-content',
//       max: 'max-content',
//       fit: 'fit-content',
//     }),
//     inset: ({ theme }) => ({
//       auto: 'auto',
//       ...theme('spacing'),
//       '1/2': '50%',
//       '1/3': '33.333333%',
//       '2/3': '66.666667%',
//       '1/4': '25%',
//       '2/4': '50%',
//       '3/4': '75%',
//       full: '100%',
//     }),
//     keyframes: {
//       spin: {
//         to: {
//           transform: 'rotate(360deg)',
//         },
//       },
//       ping: {
//         '75%, 100%': {
//           transform: 'scale(2)',
//           opacity: '0',
//         },
//       },
//       pulse: {
//         '50%': {
//           opacity: '.5',
//         },
//       },
//       bounce: {
//         '0%, 100%': {
//           transform: 'translateY(-25%)',
//           animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
//         },
//         '50%': {
//           transform: 'none',
//           animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
//         },
//       },
//     },
//     letterSpacing: {
//       tighter: '-0.05em',
//       tight: '-0.025em',
//       normal: '0em',
//       wide: '0.025em',
//       wider: '0.05em',
//       widest: '0.1em',
//     },
//     lineHeight: {
//       none: '1',
//       tight: '1.25',
//       snug: '1.375',
//       normal: '1.5',
//       relaxed: '1.625',
//       loose: '2',
//       3: '.75rem',
//       4: '1rem',
//       5: '1.25rem',
//       6: '1.5rem',
//       7: '1.75rem',
//       8: '2rem',
//       9: '2.25rem',
//       10: '2.5rem',
//     },
//     listStyleType: {
//       none: 'none',
//       disc: 'disc',
//       decimal: 'decimal',
//     },
//     margin: ({ theme }) => ({
//       auto: 'auto',
//       ...theme('spacing'),
//     }),
//     maxHeight: ({ theme }) => ({
//       ...theme('spacing'),
//       full: '100%',
//       screen: '100vh',
//       min: 'min-content',
//       max: 'max-content',
//       fit: 'fit-content',
//     }),
//     maxWidth: ({ theme, breakpoints }) => ({
//       none: 'none',
//       0: '0rem',
//       xs: '20rem',
//       sm: '24rem',
//       md: '28rem',
//       lg: '32rem',
//       xl: '36rem',
//       '2xl': '42rem',
//       '3xl': '48rem',
//       '4xl': '56rem',
//       '5xl': '64rem',
//       '6xl': '72rem',
//       '7xl': '80rem',
//       full: '100%',
//       min: 'min-content',
//       max: 'max-content',
//       fit: 'fit-content',
//       prose: '65ch',
//       ...breakpoints(theme('screens')),
//     }),
//     minHeight: {
//       0: '0px',
//       full: '100%',
//       screen: '100vh',
//       min: 'min-content',
//       max: 'max-content',
//       fit: 'fit-content',
//     },
//     minWidth: {
//       0: '0px',
//       full: '100%',
//       min: 'min-content',
//       max: 'max-content',
//       fit: 'fit-content',
//     },
//     objectPosition: {
//       bottom: 'bottom',
//       center: 'center',
//       left: 'left',
//       'left-bottom': 'left bottom',
//       'left-top': 'left top',
//       right: 'right',
//       'right-bottom': 'right bottom',
//       'right-top': 'right top',
//       top: 'top',
//     },
//     opacity: {
//       0: '0',
//       5: '0.05',
//       10: '0.1',
//       20: '0.2',
//       25: '0.25',
//       30: '0.3',
//       40: '0.4',
//       50: '0.5',
//       60: '0.6',
//       70: '0.7',
//       75: '0.75',
//       80: '0.8',
//       90: '0.9',
//       95: '0.95',
//       100: '1',
//     },
//     order: {
//       first: '-9999',
//       last: '9999',
//       none: '0',
//       1: '1',
//       2: '2',
//       3: '3',
//       4: '4',
//       5: '5',
//       6: '6',
//       7: '7',
//       8: '8',
//       9: '9',
//       10: '10',
//       11: '11',
//       12: '12',
//     },
//     padding: ({ theme }) => theme('spacing'),
//     placeholderColor: ({ theme }) => theme('colors'),
//     placeholderOpacity: ({ theme }) => theme('opacity'),
//     outlineColor: ({ theme }) => theme('colors'),
//     outlineOffset: {
//       0: '0px',
//       1: '1px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     outlineWidth: {
//       0: '0px',
//       1: '1px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     ringColor: ({ theme }) => ({
//       DEFAULT: theme(`colors.blue.500`, '#3b82f6'),
//       ...theme('colors'),
//     }),
//     ringOffsetColor: ({ theme }) => theme('colors'),
//     ringOffsetWidth: {
//       0: '0px',
//       1: '1px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     ringOpacity: ({ theme }) => ({
//       DEFAULT: '0.5',
//       ...theme('opacity'),
//     }),
//     ringWidth: {
//       DEFAULT: '3px',
//       0: '0px',
//       1: '1px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     rotate: {
//       0: '0deg',
//       1: '1deg',
//       2: '2deg',
//       3: '3deg',
//       6: '6deg',
//       12: '12deg',
//       45: '45deg',
//       90: '90deg',
//       180: '180deg',
//     },
//     saturate: {
//       0: '0',
//       50: '.5',
//       100: '1',
//       150: '1.5',
//       200: '2',
//     },
//     scale: {
//       0: '0',
//       50: '.5',
//       75: '.75',
//       90: '.9',
//       95: '.95',
//       100: '1',
//       105: '1.05',
//       110: '1.1',
//       125: '1.25',
//       150: '1.5',
//     },
//     scrollMargin: ({ theme }) => ({
//       ...theme('spacing'),
//     }),
//     scrollPadding: ({ theme }) => theme('spacing'),
//     sepia: {
//       0: '0',
//       DEFAULT: '100%',
//     },
//     skew: {
//       0: '0deg',
//       1: '1deg',
//       2: '2deg',
//       3: '3deg',
//       6: '6deg',
//       12: '12deg',
//     },
//     space: ({ theme }) => ({
//       ...theme('spacing'),
//     }),
//     stroke: ({ theme }) => theme('colors'),
//     strokeWidth: {
//       0: '0',
//       1: '1',
//       2: '2',
//     },
//     textColor: ({ theme }) => theme('colors'),
//     textDecorationColor: ({ theme }) => theme('colors'),
//     textDecorationThickness: {
//       auto: 'auto',
//       'from-font': 'from-font',
//       0: '0px',
//       1: '1px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     textUnderlineOffset: {
//       auto: 'auto',
//       0: '0px',
//       1: '1px',
//       2: '2px',
//       4: '4px',
//       8: '8px',
//     },
//     textIndent: ({ theme }) => ({
//       ...theme('spacing'),
//     }),
//     textOpacity: ({ theme }) => theme('opacity'),
//     transformOrigin: {
//       center: 'center',
//       top: 'top',
//       'top-right': 'top right',
//       right: 'right',
//       'bottom-right': 'bottom right',
//       bottom: 'bottom',
//       'bottom-left': 'bottom left',
//       left: 'left',
//       'top-left': 'top left',
//     },
//     transitionDelay: {
//       75: '75ms',
//       100: '100ms',
//       150: '150ms',
//       200: '200ms',
//       300: '300ms',
//       500: '500ms',
//       700: '700ms',
//       1000: '1000ms',
//     },
//     transitionDuration: {
//       DEFAULT: '150ms',
//       75: '75ms',
//       100: '100ms',
//       150: '150ms',
//       200: '200ms',
//       300: '300ms',
//       500: '500ms',
//       700: '700ms',
//       1000: '1000ms',
//     },
//     transitionProperty: {
//       none: 'none',
//       all: 'all',
//       DEFAULT:
//         'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
//       colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
//       opacity: 'opacity',
//       shadow: 'box-shadow',
//       transform: 'transform',
//     },
//     transitionTimingFunction: {
//       DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
//       linear: 'linear',
//       in: 'cubic-bezier(0.4, 0, 1, 1)',
//       out: 'cubic-bezier(0, 0, 0.2, 1)',
//       'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
//     },
//     translate: ({ theme }) => ({
//       ...theme('spacing'),
//       '1/2': '50%',
//       '1/3': '33.333333%',
//       '2/3': '66.666667%',
//       '1/4': '25%',
//       '2/4': '50%',
//       '3/4': '75%',
//       full: '100%',
//     }),
//     width: ({ theme }) => ({
//       auto: 'auto',
//       ...theme('spacing'),
//       '1/2': '50%',
//       '1/3': '33.333333%',
//       '2/3': '66.666667%',
//       '1/4': '25%',
//       '2/4': '50%',
//       '3/4': '75%',
//       '1/5': '20%',
//       '2/5': '40%',
//       '3/5': '60%',
//       '4/5': '80%',
//       '1/6': '16.666667%',
//       '2/6': '33.333333%',
//       '3/6': '50%',
//       '4/6': '66.666667%',
//       '5/6': '83.333333%',
//       '1/12': '8.333333%',
//       '2/12': '16.666667%',
//       '3/12': '25%',
//       '4/12': '33.333333%',
//       '5/12': '41.666667%',
//       '6/12': '50%',
//       '7/12': '58.333333%',
//       '8/12': '66.666667%',
//       '9/12': '75%',
//       '10/12': '83.333333%',
//       '11/12': '91.666667%',
//       full: '100%',
//       screen: '100vw',
//       min: 'min-content',
//       max: 'max-content',
//       fit: 'fit-content',
//     }),
//     willChange: {
//       auto: 'auto',
//       scroll: 'scroll-position',
//       contents: 'contents',
//       transform: 'transform',
//     },
//     zIndex: {
//       auto: 'auto',
//       0: '0',
//       10: '10',
//       20: '20',
//       30: '30',
//       40: '40',
//       50: '50',
//     },
//   },
//   variantOrder: [
//     'first',
//     'last',
//     'odd',
//     'even',
//     'visited',
//     'checked',
//     'empty',
//     'read-only',
//     'group-hover',
//     'group-focus',
//     'focus-within',
//     'hover',
//     'focus',
//     'focus-visible',
//     'active',
//     'disabled',
//   ],
//   plugins: [],
// }
