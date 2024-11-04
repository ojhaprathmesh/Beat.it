import { insertNavbar } from "../components/navbar.js";

document.addEventListener("DOMContentLoaded", () => {
    insertNavbar(".navbar");

    const logo = document.getElementById("logo");
    logo.addEventListener("click", () => {
        window.location.assign("HomePage.html");
    });

    const menu = document.querySelector(".menu");
    menu.addEventListener("click", (event) => {
        menu.classList.toggle("show-overlay");

        const profile = document.getElementById("profile");
        profile.addEventListener("click", () => {
            window.location.assign("ProfilePage.html")
        });

        const logout = document.getElementById("logout");
        logout.addEventListener("click", () => {
            window.location.assign("LoginPage.html")
        });

        event.stopPropagation(); // Prevent this click from being caught by the document listener
    });

    document.addEventListener("click", (event) => {
        if (menu.classList.contains("show-overlay") && !menu.contains(event.target)) {
            menu.classList.remove("show-overlay");
        }
    });
});
