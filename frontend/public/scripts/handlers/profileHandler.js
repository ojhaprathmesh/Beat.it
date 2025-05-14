/**
 * Profile Handler - Manages profile interactions and Firebase integration
 */

document.addEventListener('DOMContentLoaded', function () {
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
    const noFavoritesMessage = document.querySelector('.no-favorites');

// Preferences elements
    const qualitySelect = document.getElementById('quality');
    const savePreferencesBtn = document.getElementById('save-preferences');

    // Profile avatar
    const profileAvatar = document.getElementById('profile-avatar');
    const photoUpload = document.getElementById('photo-upload');

    // Delete account elements
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const deleteErrorMessage = document.getElementById('delete-error');

    // Quality preference
    let audioQualityPreference = 'auto';
    
    // Initialize profile data
    loadUserProfile();

    // Menu switching
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const targetSection = this.getAttribute('data-section');

            // Update active states
            menuItems.forEach(mi => mi.classList.remove('active'));
            contentSections.forEach(cs => cs.classList.remove('active'));

            // Set new active section
            this.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            window.location.href = '/logout';
        });
    }

    // Profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateProfile();
        });
    }

    // Preferences save button
    if (savePreferencesBtn) {
        savePreferencesBtn.addEventListener('click', function () {
            savePreferences();
        });
    }

    // Photo upload
    if (photoUpload) {
        photoUpload.addEventListener('change', function (e) {
            uploadProfilePhoto(e.target.files[0]);
        });
    }

    // Delete account button
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            openDeleteModal();
        });
    }

    // Close modal events
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeDeleteModal);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    // Confirm account deletion
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteUserAccount();
        });
    }

    // Allow Enter key to trigger deletion from password field
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                deleteUserAccount();
            }
        });
    }

    // Window click to close modal
    window.addEventListener('click', function(event) {
        if (event.target === deleteAccountModal) {
            closeDeleteModal();
        }
    });

    // Function to load user profile data
    function loadUserProfile() {
        fetch('/api/user/profile')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load profile');
                }
                return response.json();
            })
            .then(data => {
                // Populate form fields
                if (firstNameInput) firstNameInput.value = data.firstName || '';
                if (lastNameInput) lastNameInput.value = data.lastName || '';
                if (emailInput) emailInput.value = data.email || '';
                if (usernameInput) usernameInput.value = data.username || '';
                if (phoneInput) phoneInput.value = data.phoneNumber || '';

                // Set profile avatar
                if (profileAvatar && data.profilePicture) {
                    profileAvatar.src = data.profilePicture;
                }

                // Set preferences
                if (data.preferences) {
                    // Set audio quality preference
                    if (qualitySelect && data.preferences.audioQuality) {
                        qualitySelect.value = data.preferences.audioQuality;
                        audioQualityPreference = data.preferences.audioQuality;
                    }
                }

                // Also load favorites
                loadFavorites();
            })
            .catch(error => {
                console.error('Error loading profile:', error);
            });
    }

    // Load user favorites
    function loadFavorites() {
        return fetch('/api/user/favorites')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load favorites');
                }
                return response.json();
            })
            .then(favorites => {
                console.log('Loaded favorites:', favorites);

                // Ensure favoritesContainer is available
                if (!favoritesContainer) {
                    console.error('Favorites container not found in the DOM');
                    return;
                }

                // Show/hide no favorite message
                if (!favorites || favorites.length === 0) {
                    // Clear the container and show no favorites message
                    favoritesContainer.innerHTML = `
                        <div class="no-favorites">
                            <p>You haven't added any favorites yet. Start by liking songs while listening!</p>
                        </div>
                    `;
                    return;
                }

                // Clear existing favorites
                favoritesContainer.innerHTML = '';

                // Add CSS for hover effects
                const style = document.createElement('style');
                style.textContent = `
                    .favorite-track {
                        transition: all 0.2s ease;
                        border-radius: 8px;
                        cursor: pointer;
                        position: relative;
                    }
                    .favorite-track:hover {
                        background-color: rgba(255, 59, 92, 0.1);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    .favorite-track .play-icon {
                        opacity: 0.7;
                        transition: opacity 0.2s ease;
                    }
                    .favorite-track:hover .play-icon {
                        opacity: 1;
                        color: var(--primary);
                    }
                    .favorite-track .track-cover {
                        border-radius: 6px;
                        transition: transform 0.2s ease;
                    }
                    .favorite-track:hover .track-cover {
                        transform: scale(1.05);
                    }
                `;
                document.head.appendChild(style);

                // Add favorites to container
                favorites.forEach(track => {
                    const trackElement = createTrackElement(track);
                    favoritesContainer.appendChild(trackElement);
                });

                // Add event listeners to the new track elements
                addTrackEventListeners();
            })
            .catch(error => {
                console.error('Error loading favorites:', error);
                if (favoritesContainer) {
                    favoritesContainer.innerHTML = `
                        <div class="error-message">
                            <p>There was an error loading your favorites. Please try again later.</p>
                        </div>
                    `;
                }
            });
    }

    // Create a track element for favorites
    function createTrackElement(track) {
        const trackElement = document.createElement('div');
        trackElement.className = 'favorite-track';
        trackElement.dataset.songId = track.id;
        trackElement.style.cursor = 'pointer';

        // Use albumCover if available, otherwise fallback to thumbnails or a default image
        const coverImage = track.albumCover || `/assets/album-covers/${track.id}.jpg` || '/assets/default-cover.jpg';

        trackElement.innerHTML = `
            <img src="${coverImage}" alt="${track.title}" class="track-cover">
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${typeof track.artist === 'string' ? track.artist : Array.isArray(track.artist) ? track.artist.join(', ') : ''}</div>
            </div>
            <div class="track-actions">
                <i class="fas fa-play play-icon" title="Play"></i>
                <i class="fas fa-heart remove-favorite" style="color: var(--primary);" title="Remove from favorites"></i>
            </div>
        `;

        // Make the whole track element clickable to play the song
        trackElement.addEventListener('click', function (e) {
            // Only handle the click if it's not on the remove-favorite button
            if (!e.target.closest('.remove-favorite')) {
                e.preventDefault();
                const songId = this.dataset.songId;
                console.log('Clicked favorite track with ID:', songId);
                playSongById(songId).then();
            }
        });

        // Add specific event listeners for action buttons
        const removeIcon = trackElement.querySelector('.remove-favorite');
        if (removeIcon) {
            removeIcon.addEventListener('click', function (e) {
                // Stop event propagation to prevent the track click handler from firing
                e.stopPropagation();
                const trackElement = this.closest('.favorite-track');
                const songId = trackElement.dataset.songId;
                removeFavorite(songId).then();
            });
        }

        // Add specific event listener for play icon to make sure it works
        const playIcon = trackElement.querySelector('.play-icon');
        if (playIcon) {
            playIcon.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent double triggering with parent
                const trackElement = this.closest('.favorite-track');
                const songId = trackElement.dataset.songId;
                console.log('Play icon clicked for song ID:', songId);
                playSongById(songId).then();
            });
        }

        return trackElement;
    }

    // Add event listeners to track elements
    function addTrackEventListeners() {
        // Play buttons
        document.querySelectorAll('.play-icon').forEach(playIcon => {
            playIcon.addEventListener('click', function () {
                const trackElement = this.closest('.favorite-track');
                const songId = trackElement.dataset.songId;
                playSongById(songId).then();
            });
        });

        // Remove from favorites buttons
        document.querySelectorAll('.remove-favorite').forEach(removeIcon => {
            removeIcon.addEventListener('click', function () {
                const trackElement = this.closest('.favorite-track');
                const songId = trackElement.dataset.songId;
                removeFavorite(songId).then();
            });
        });
    }

    // Play song by ID
    function playSongById(songId) {
        console.log('Finding song with ID:', songId);
        return fetch('/api/data/songsData')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load songs data');
                return response.json();
            })
            .then(songs => {
                console.log('Loaded songs data, total songs:', songs.length);

                // Convert IDs to strings for reliable comparison
                const songIdStr = songId.toString();
                const song = songs.find(s => s.id.toString() === songIdStr);

                if (song) {
                    console.log('Found song to play:', song.title, 'by', song.artist);
                    playSong(song);
                } else {
                    console.error('Song not found with ID:', songId);
                    alert('Sorry, the song could not be found.');
                }
            })
            .catch(error => {
                console.error('Error playing song by ID:', error);
                alert('Sorry, there was an error playing the song.');
            });
    }

    // Play song function
    function playSong(song) {
        console.log('Dispatching play-song event with song:', song.title);

        // Check if MusicControl is available globally to play directly
        if (window.musicPlayer && typeof window.musicPlayer.loadAndPlaySong === 'function') {
            window.musicPlayer.loadAndPlaySong(song);
            return;
        }

        // Otherwise dispatch event for other components to handle
        const event = new CustomEvent('play-song', {
            detail: song
        });
        document.dispatchEvent(event);

        // Also try to play using the audio element directly
        const audioElement = document.getElementById('songPlayer');
        if (audioElement) {
            // Update the source
            const source = audioElement.querySelector('source');
            if (source && song.file) {
                source.src = song.file;
                audioElement.load();
                audioElement.play().catch(err => console.error('Error playing audio:', err));
            }
        }
    }

    // Remove favorite function
    function removeFavorite(songId) {
        return fetch(`/api/user/favorites/${songId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to remove favorite');
                }

                // Remove the track element from the DOM instead of reloading all favorites
                const trackElement = document.querySelector(`.favorite-track[data-song-id="${songId}"]`);
                if (trackElement) {
                    // Add a fade-out animation
                    trackElement.style.opacity = '0';
                    trackElement.style.transform = 'translateX(20px)';
                    trackElement.style.transition = 'opacity 0.3s, transform 0.3s';

                    // Remove after animation completes
                    setTimeout(() => {
                        trackElement.remove();

                        // Check if there are any favorites left
                        if (!document.querySelector('.favorite-track')) {
                            // No favorites left, show the no-favorites message
                            if (favoritesContainer) {
                                favoritesContainer.innerHTML = `
                                    <div class="no-favorites">
                                        <p>You haven't added any favorites yet. Start by liking songs while listening!</p>
                                    </div>
                                `;
                            }
                        }
                    }, 300);
                }

                // Update any heart icons in the player or elsewhere
                updateHeartIcons().then();

                // Check if we need to refresh the page
                if (window.checkForRefresh) {
                    window.checkForRefresh('/api/user/check-favorite/' + songId);
                }
            })
            .catch(error => {
                console.error('Error removing favorite:', error);
                alert('Failed to remove from favorites. Please try again.');
            });
    }

    // Update heart icons based on favorites
    function updateHeartIcons() {
        return fetch('/api/user/favorites')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load favorites');
                }
                return response.json();
            })
            .then(favorites => {
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
            })
            .catch(error => {
                console.error('Error updating heart icons:', error);
            });
    }

    // Save profile data
    function updateProfile() {
        return fetch('/api/user/profile', {
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
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update profile');
                }

                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';

                // Update the username in the sidebar
                const userNameElement = document.querySelector('.user-name');
                if (userNameElement) {
                    userNameElement.textContent = `${firstNameInput.value} ${lastNameInput.value}`;
                }

                // Hide a success message after a few seconds
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                successMessage.style.display = 'none';
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Failed to update profile. Please try again.';
            });
    }

    // Handle photo upload
    function uploadProfilePhoto(file) {
        if (!file) return;

        const fileType = file.type;
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!validImageTypes.includes(fileType)) {
            alert('Please select a valid image file (JPEG, PNG, WEBP, GIF)');
            return;
        }

        // Show loading state
        profileAvatar.style.opacity = '0.5';

        const formData = new FormData();
        formData.append('profilePicture', file);

        return fetch('/api/user/profile-picture', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to upload profile picture');
                }
                return response.json();
            })
            .then(data => {
                // Update profile picture
                profileAvatar.src = data.profilePicture;

                // For a smooth transition
                setTimeout(() => {
                    profileAvatar.style.opacity = '1';
                }, 300);
            })
            .catch(error => {
                console.error('Error uploading profile picture:', error);
                alert('There was an error uploading your profile picture. Please try again.');
                profileAvatar.style.opacity = '1';
            });
    }

    // Save user preferences
    function savePreferences() {
        // Get values
        const audioQuality = qualitySelect ? qualitySelect.value : audioQualityPreference;

        // Create preferences object
        const preferences = {
            audioQuality,
        };

        // Save to server
        fetch('/api/user/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferences)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save preferences');
                }
                return response.json();
            })
            .then(data => {
                // Show success message or update UI
                showMessage(true, 'Preferences saved successfully');
            })
            .catch(error => {
                console.error('Error saving preferences:', error);
                showMessage(false, 'Failed to save preferences');
            });
    }

    // Show message function
    function showMessage(isSuccess, message) {
        if (isSuccess) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        } else {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    }

    // Function to open delete account modal
    function openDeleteModal() {
        if (deleteAccountModal) {
            deleteAccountModal.style.display = 'flex';
            if (confirmPasswordInput) {
                confirmPasswordInput.value = '';
                confirmPasswordInput.focus();
            }
            if (deleteErrorMessage) {
                deleteErrorMessage.style.display = 'none';
            }
        }
    }

    // Function to close delete account modal
    function closeDeleteModal() {
        if (deleteAccountModal) {
            deleteAccountModal.style.display = 'none';
        }
    }

    // Function to delete user account
    function deleteUserAccount() {
        if (!confirmPasswordInput || !confirmPasswordInput.value) {
            if (deleteErrorMessage) {
                deleteErrorMessage.textContent = 'Please enter your password to confirm';
                deleteErrorMessage.style.display = 'block';
            }
            return;
        }

        // Disable button to prevent multiple requests
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';
        }

        fetch('/api/user/delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: confirmPasswordInput.value
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to delete account');
                });
            }
            return response.json();
        })
        .then(data => {
            // Success - redirect to login page
            window.location.href = '/login?message=account_deleted';
        })
        .catch(error => {
            console.error('Error deleting account:', error);
            if (deleteErrorMessage) {
                deleteErrorMessage.textContent = error.message || 'Failed to delete account. Please try again.';
                deleteErrorMessage.style.display = 'block';
            }

            // Re-enable button for retry
            if (confirmDeleteBtn) {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Delete Account';
            }
        });
    }
});