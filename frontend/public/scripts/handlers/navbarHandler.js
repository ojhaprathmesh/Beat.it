document.addEventListener("DOMContentLoaded", () => {
    const logo = document.getElementById("logo");
    const menu = document.querySelector(".menu");

    // Toggle menu state and listeners
    const toggleMenu = (isOpen) => {
        menu.classList.toggle("show-overlay", isOpen);
    };

    logo.addEventListener("click", () => window.location.assign("/home"));

    menu.addEventListener("click", (event) => {
        toggleMenu(!menu.classList.contains("show-overlay"));
        event.stopPropagation();
    });

    // Close menu when clicking outside of it
    document.addEventListener("click", (event) => {
        if (menu.classList.contains("show-overlay") && !menu.contains(event.target)) {
            toggleMenu(false);
        }
    });
});
