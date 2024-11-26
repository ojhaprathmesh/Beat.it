const loader = document.createElement("div");
loader.className = "preloader";

const loaderStyle = loader.style;
loaderStyle.width = "100vw";
loaderStyle.height = "100vh";
loaderStyle.position = "fixed";
loaderStyle.top = 0;
loaderStyle.zIndex = 100;
loaderStyle.background = 'white url(../assets/loading.gif) no-repeat center center';

document.querySelector("body").appendChild(loader);

window.addEventListener("load", () => {
    setTimeout(() => {
        loader.style.display = "none";
    }, 1500);
});