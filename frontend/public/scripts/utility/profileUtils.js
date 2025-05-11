/**
 * Utility functions for profile-related operations
 */

// Global variable to keep track of the latest profile image URL
let currentProfileImageUrl = null;

/**
 * Preloads an image to ensure it's fully loaded before displaying
 * @param {string} src - The image source URL
 * @returns {Promise} - A promise that resolves when the image is loaded
 */
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Updates all profile images in the page with the new URL
 * @param {string} imageUrl - The new profile image URL
 */
async function updateAllProfileImages(imageUrl) {
    if (!imageUrl) return;
    
    // Store the current URL for future reference
    currentProfileImageUrl = imageUrl;
    
    // Add a random query parameter to bypass cache
    const cacheBustUrl = `${imageUrl}?t=${new Date().getTime()}`;
    
    console.log('Updating all profile images to:', cacheBustUrl);

    try {
        // Preload the image first to ensure it's in the browser cache
        await preloadImage(cacheBustUrl);
        
        // Update all profile avatars in the page
        const profileAvatars = document.querySelectorAll('.profile-picture, #profile-avatar');
        profileAvatars.forEach(avatar => {
            avatar.src = cacheBustUrl;
        });
        
        // Update all profile letter containers
        const profileLetters = document.querySelectorAll('.profile-letter, #profile-menu-button');
        profileLetters.forEach(container => {
            // Check if there's already an image
            let img = container.querySelector('img');
            if (img) {
                img.src = cacheBustUrl;
            } else {
                // Create a new image and replace the letter
                container.innerHTML = `<img src="${cacheBustUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
        });
        
        // Apply direct style updates to ensure rendering
        document.querySelectorAll('img[src="' + cacheBustUrl + '"]').forEach(img => {
            // Force a reflow to ensure the image is updated
            img.style.opacity = '0.99';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 50);
        });
        
        // Fire a custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
            detail: { imageUrl: cacheBustUrl }
        }));
        
        return cacheBustUrl;
    } catch (error) {
        console.error('Error preloading or updating profile image:', error);
        return imageUrl; // Return original URL if there was an error
    }
}

// Make the functions available globally
window.profileUtils = {
    updateAllProfileImages,
    preloadImage,
    getCurrentProfileImage: () => currentProfileImageUrl
}; 