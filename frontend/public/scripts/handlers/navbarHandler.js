document.addEventListener("DOMContentLoaded", () => {
    const logo = document.getElementById("logo");
    const menu = document.querySelector(".menu");

    const handleProfileClick = () => {
        window.location.assign("/profile");
    };

    const handleLogoutClick = () => {
        window.location.assign("/login");
    };

    // Toggle listeners based on menu state
    const toggleMenuListeners = (add) => {
        const profile = document.getElementById("profile");
        const logout = document.getElementById("logout");

        if (add) {
            profile.addEventListener("click", handleProfileClick);
            logout.addEventListener("click", handleLogoutClick);
        } else {
            profile.removeEventListener("click", handleProfileClick);
            logout.removeEventListener("click", handleLogoutClick);
        }
    };

    logo.addEventListener("click", () => {
        window.location.assign("/home");
    });

    menu.addEventListener("click", (event) => {
        const isOpen = menu.classList.toggle("show-overlay");

        toggleMenuListeners(isOpen); // Add or remove listeners based on menu state
        event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
        if (menu.classList.contains("show-overlay") && !menu.contains(event.target)) {
            menu.classList.remove("show-overlay");
            toggleMenuListeners(false);
        }
    });
});
