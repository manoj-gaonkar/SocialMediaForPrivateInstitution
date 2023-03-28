
document.addEventListener("DOMContentLoaded", () => {
    console.log("kdjkdjkdjdkfjdkfjkdfj");
    document.querySelectorAll(".inp").forEach(input => {
        input.addEventListener('input', () => {
            if ((document.querySelector('.usrnm').value.length === 0) || (document.querySelector('.pswd').value.length === 0)) {
                document.querySelector('input[type="submit"]').disabled = true;
            }
            else {
                document.querySelector('input[type="submit"]').disabled = false;
            }
        });
    });
})


document.getElementById('usnlogin').addEventListener('keyup',() => {
    console.log("kddk");
})