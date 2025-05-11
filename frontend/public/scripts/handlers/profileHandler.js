/**
 * Profile Handler - Manages profile interactions and Firebase integration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get profile form elements
    const profileForm = document.getElementById('profile-form');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const phoneInput = document.getElementById('phone');
    const successMessage = document.querySelector('.success-message');
    const errorMessage = document.querySelector('.error-message');

    // Get sidebar menu elements
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Favorites section
    const favoritesContainer = document.getElementById('favorites-container');
    const noFavoritesElement = document.querySelector('.no-favorites');
    
    // Preferences elements
    const qualitySelect = document.getElementById('quality');
    const lightThemeBtn = document.getElementById('light-theme');
    const darkThemeBtn = document.getElementById('dark-theme');
    const savePreferencesBtn = document.getElementById('save-preferences');
    
    // Profile avatar
    const profileAvatar = document.getElementById('profile-avatar');
    const photoUpload = document.getElementById('photo-upload');

    // Theme preferences
    let themePreference = 'light';

    // Load user profile data
    async function loadProfileData() {
        try {
            const response = await fetch('/api/user/profile');
            
            if (!response.ok) {
                throw new Error('Failed to load profile data');
            }
            
            const userData = await response.json();
            
            // Populate form fields
            firstNameInput.value = userData.firstName || '';
            lastNameInput.value = userData.lastName || '';
            emailInput.value = userData.email || '';
            usernameInput.value = userData.username || '';
            phoneInput.value = userData.phoneNumber || '';
            
            // Update profile picture if available
            if (userData.profilePicture && userData.profilePicture !== '/assets/profile/default-avatar.jpg') {
                profileAvatar.src = userData.profilePicture;
            } else {
                // Make sure default avatar is set if nothing else is available
                profileAvatar.src = '/assets/profile/default-avatar.jpg';
            }
            
            return userData;
        } catch (error) {
            console.error('Error loading profile data:', error);
            errorMessage.textContent = 'Failed to load profile data. Please try again.';
            errorMessage.style.display = 'block';
            
            // Set default avatar on error
            profileAvatar.src = '/assets/profile/default-avatar.jpg';
        }
    }
    
    // Load user preferences
    async function loadPreferences() {
        try {
            const response = await fetch('/api/user/preferences');
            
            if (!response.ok) {
                throw new Error('Failed to load preferences');
            }
            
            const preferences = await response.json();
            
            // Set audio quality
            qualitySelect.value = preferences.audioQuality || 'auto';
            
            // Set theme preference
            themePreference = preferences.theme || 'light';
            applyTheme(themePreference);
            
            return preferences;
    } catch (error) {
            console.error('Error loading preferences:', error);
    }
}

    // Load user favorites
    async function loadFavorites() {
    try {
        const response = await fetch('/api/user/favorites');
        
        if (!response.ok) {
            throw new Error('Failed to load favorites');
        }
        
        const favorites = await response.json();
        console.log('Loaded favorites:', favorites);
            
        // Show/hide no favorites message
        if (favorites.length === 0) {
            if (noFavoritesElement) {
                noFavoritesElement.style.display = 'block';
            }
            
            // Clear the container if there are no favorites
            if (favoritesContainer) {
                favoritesContainer.innerHTML = `
                    <div class="no-favorites">
                        <p>You haven't added any favorites yet. Start by liking songs while listening!</p>
                    </div>
                `;
            }
            return;
        } else if (noFavoritesElement) {
            noFavoritesElement.style.display = 'none';
        }
            
        // Clear existing favorites
        if (favoritesContainer) {
            favoritesContainer.innerHTML = '';
        
            // Add favorites to container
            favorites.forEach(track => {
                const trackElement = createTrackElement(track);
                favoritesContainer.appendChild(trackElement);
            });
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        if (favoritesContainer) {
            favoritesContainer.innerHTML = `
                <div class="error-message">
                    <p>There was an error loading your favorites. Please try again later.</p>
                </div>
            `;
        }
    }
}
        
    // Create track element for favorites
    function createTrackElement(track) {
            const trackElement = document.createElement('div');
            trackElement.className = 'favorite-track';
        trackElement.dataset.songId = track.id;
            
            trackElement.innerHTML = `
            <img src="${track.thumbnail || `/assets/thumbnails/${track.id}.jpg`}" alt="${track.title}" class="track-cover">
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-actions">
                <i class="fas fa-play play-icon" title="Play"></i>
                <i class="fas fa-heart remove-favorite" style="color: var(--primary);" title="Remove from favorites"></i>
                </div>
            `;
            
        // Add event listeners
        const playIcon = trackElement.querySelector('.play-icon');
        const removeIcon = trackElement.querySelector('.remove-favorite');
        
        if (playIcon) {
            playIcon.addEventListener('click', function() {
                playSong(track);
            });
        }
        
        if (removeIcon) {
            removeIcon.addEventListener('click', function() {
                removeFavorite(track.id);
            });
        }
        
        return trackElement;
    }

    // Play song function
    function playSong(song) {
        // Dispatch custom event to be caught by the player handler
        const event = new CustomEvent('play-song', { detail: song });
        document.dispatchEvent(event);
    }

    // Remove favorite function
    async function removeFavorite(songId) {
        try {
            const response = await fetch(`/api/user/favorites/${songId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to remove favorite');
            }
            
            // Reload favorites
            loadFavorites();
            
            // Update any heart icons in the player or elsewhere
            updateHeartIcons();
    } catch (error) {
            console.error('Error removing favorite:', error);
        }
    }

    // Update heart icons based on favorites
    async function updateHeartIcons() {
        try {
            const response = await fetch('/api/user/favorites');
            
            if (!response.ok) {
                throw new Error('Failed to load favorites');
            }
            
            const favorites = await response.json();
            const favoriteIds = favorites.map(track => track.id);
            
            // Update heart icons in the player
            const heartIcons = document.querySelectorAll('.heart-icon');
            
            heartIcons.forEach(icon => {
                const songId = icon.dataset.songId;
                
                if (favoriteIds.includes(songId)) {
                    icon.classList.add('active');
                } else {
                    icon.classList.remove('active');
                }
            });
        } catch (error) {
            console.error('Error updating heart icons:', error);
        }
    }

    // Save profile data
    async function saveProfile(event) {
        event.preventDefault();
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                username: usernameInput.value,
                phoneNumber: phoneInput.value
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        
        // Update the user name in the sidebar
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = `${firstNameInput.value} ${lastNameInput.value}`;
        }
        
        // Hide success message after a few seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Error updating profile:', error);
        successMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Failed to update profile. Please try again.';
    }
}
    
    // Apply theme function
    function applyTheme(theme) {
        // Set the theme attribute on html element
        document.documentElement.setAttribute('data-theme', theme);
        
        // Also add/remove the class if needed for CSS
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.documentElement.style.setProperty('--text-primary', '#f5f5f7');
            document.documentElement.style.setProperty('--text-secondary', '#ccc');
            document.documentElement.style.setProperty('--card-bg', '#333');
            document.documentElement.style.setProperty('--background', '#222');
        } else {
            document.body.classList.remove('dark-theme');
            document.documentElement.style.setProperty('--text-primary', '#121212');
            document.documentElement.style.setProperty('--text-secondary', '#555555');
            document.documentElement.style.setProperty('--card-bg', '#ffffff');
            document.documentElement.style.setProperty('--background', '#f5f5f7');
        }
        
        // Save the theme preference to localStorage as well for immediate effect
        localStorage.setItem('theme', theme);
    }

    // Handle photo upload
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = file.type;
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!validImageTypes.includes(fileType)) {
        alert('Please select a valid image file (JPEG, PNG, WEBP, GIF)');
        return;
    }
    
    // Show loading state
    profileAvatar.style.opacity = '0.5';
    
    try {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        const response = await fetch('/api/user/profile-picture', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload profile picture');
        }
        
        const data = await response.json();
        
        // Update profile picture
        profileAvatar.src = data.profilePicture;
        
        // For a smooth transition
        setTimeout(() => {
            profileAvatar.style.opacity = '1';
        }, 300);
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('There was an error uploading your profile picture. Please try again.');
        profileAvatar.style.opacity = '1';
    }
}

    // Handle sidebar menu clicks
    function handleMenuClick() {
        // Remove active class from all menu items and content sections
        menuItems.forEach(item => item.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Add active class to clicked menu item and corresponding content section
        this.classList.add('active');
        const sectionId = this.dataset.section;
        document.getElementById(sectionId).classList.add('active');
}

    // Handle theme button clicks
    function handleThemeClick(theme) {
        themePreference = theme;
        applyTheme(theme);
        
        // Save the preference to the server
        savePreferences();
    }

    // Handle logout
    async function handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
        });
        
            if (response.ok) {
                window.location.href = '/login';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Failed to logout. Please try again.');
        }
        }
        
    // Add event listeners
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    if (menuItems.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', handleMenuClick);
        });
    }
    
    if (lightThemeBtn) {
        lightThemeBtn.addEventListener('click', () => handleThemeClick('light'));
    }
    
    if (darkThemeBtn) {
        darkThemeBtn.addEventListener('click', () => handleThemeClick('dark'));
    }
    
    if (savePreferencesBtn) {
        savePreferencesBtn.addEventListener('click', savePreferences);
    }
    
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Load user data when the page loads
    loadProfileData();
    loadPreferences();
    loadFavorites();
    
    // Update heart icons for liked songs
    updateHeartIcons();
    
    // Update heart icons when songs change in the player
    document.addEventListener('song-changed', updateHeartIcons);
}); 

// Save preferences
async function savePreferences() {
    try {
        console.log('Saving preferences:', { theme: themePreference, audioQuality: qualitySelect.value });
        
        const response = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                theme: themePreference,
                audioQuality: qualitySelect.value
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update preferences');
        }
        
        alert('Preferences saved successfully!');
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Failed to save preferences. Please try again.');
    }
}



