/**
 * Navbar Handler - Manages navbar interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('NavbarHandler loaded');

    // Get menu element
    const menuElement = document.querySelector('.menu');

    if (menuElement) {
        console.log('Menu element found');

        // Add click event listener to the menu
        menuElement.addEventListener('click', function (e) {
            console.log('Menu clicked');
            this.classList.toggle('show-overlay');

            // Prevent event from bubbling to document
            e.stopPropagation();
        });

        // Navigation functions
        document.getElementById('profile').addEventListener('click', function (e) {
            console.log('Profile clicked');
            window.location.href = '/profile';
            e.stopPropagation();
        });

        document.getElementById('logout').addEventListener('click', function (e) {
            console.log('Logout clicked');
            window.location.href = '/login';
            e.stopPropagation();
        });

        // Close the menu when clicking outside
        document.addEventListener('click', function () {
            menuElement.classList.remove('show-overlay');
        });
    } else {
        console.error('Menu element not found');
    }
});
