import {MusicControl} from "../classes/MusicControl.js";

// Keep track of the current song ID
let currentSongId = null;

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtns = document.querySelectorAll(likeBtnSelector);

    likeBtns.forEach((likeBtn) => {
        // Remove the existing event listener first to prevent duplicates
        const newLikeBtn = likeBtn.cloneNode(true);
        likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);

        newLikeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const checkbox = newLikeBtn.querySelector(checkboxSelector);
            const isLiked = !checkbox.checked;

            const audioElement = document.getElementById('songPlayer');
            const songId = audioElement ? audioElement.getAttribute('data-song-id') : null;

            if (!songId) {
                console.error("No song ID found for like button");
                return;
            }

            const heartIcon = newLikeBtn.querySelector(".fa-heart");

            // Update UI first
            checkbox.checked = isLiked;
            newLikeBtn.classList.toggle("liked", isLiked);
            if (heartIcon) {
                heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
            }

            fetch(`/api/user/favorites/${songId}`, {
                method: isLiked ? 'POST' : 'DELETE'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to ${isLiked ? 'add' : 'remove'} favorite`);
                    }

                    console.log(`Song ${isLiked ? 'added to' : 'removed from'} favorites:`, songId);

                    // Use checkForRefresh to check if we need to refresh the page
                    if (window.checkForRefresh) {
                        window.checkForRefresh('/api/user/check-favorite/' + songId);
                    }
                })
                .catch(error => {
                    console.error('Error updating favorite status:', error);
                    // Revert UI changes on error
                    checkbox.checked = !isLiked;
                    newLikeBtn.classList.toggle("liked", !isLiked);
                    if (heartIcon) {
                        heartIcon.style.color = !isLiked ? "red" : "#FEFFF1";
                    }
                    alert(`Failed to ${isLiked ? 'add to' : 'remove from'} favorites. Please try again.`);
                });
        });

    });
};

// Update like button state based on the current song
function updateLikeButtonState(songId) {
    if (!songId) return Promise.resolve(false);

    currentSongId = songId;
    const songIdStr = songId.toString();

    return fetch('/api/user/favorites')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch favorites');
            }
            return response.json();
        })
        .then(favorites => {
            const isLiked = favorites.some(song => {
                const favSongId = song.id ? song.id.toString() : '';
                return favSongId === songIdStr;
            });

            console.log(`Song ${songId} is ${isLiked ? 'liked' : 'not liked'}`);

            // First, update the player's like button
            const playerLikeBtn = document.querySelector('.player .like-btn');
            if (playerLikeBtn) {
                const checkbox = playerLikeBtn.querySelector('.like-check');
                if (checkbox) checkbox.checked = isLiked;
                playerLikeBtn.classList.toggle('liked', isLiked);

                const heartIcon = playerLikeBtn.querySelector('.fa-heart');
                if (heartIcon) {
                    heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
                }
                
                // Ensure the button has the song ID
                playerLikeBtn.dataset.songId = songIdStr;
            }
            
            // Then update any album page song that matches this ID
            if (window.location.pathname.startsWith('/album')) {
                const albumLikeBtn = document.querySelector(`.album-songs .like-btn[data-song-id="${songIdStr}"]`);
                if (albumLikeBtn) {
                    const checkbox = albumLikeBtn.querySelector('.like-check');
                    if (checkbox) checkbox.checked = isLiked;
                    albumLikeBtn.classList.toggle('liked', isLiked);

                    const heartIcon = albumLikeBtn.querySelector('.fa-heart');
                    if (heartIcon) {
                        heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
                    }
                }
            }

            return isLiked;
        })
        .catch(error => {
            console.error('Error updating like button state:', error);
            return false;
        });
}

const updateVolumeUI = (volume, [muteIcon, lowIcon, midIcon, highIcon], audioElement, sliderElement) => {
    // Parse volume to ensure it's a number and handle potential string inputs
    volume = parseInt(volume, 10);
    
    // Set audio volume and update slider
    audioElement.volume = volume / 100;
    sliderElement.value = volume;
    sliderElement.style.setProperty("--width-v", `${volume}%`);

    // Immediately update icon visibility without transitions
    // First hide all icons
    [muteIcon, lowIcon, midIcon, highIcon].forEach(icon => {
        icon.style.display = "none";
    });

    // Then show only the appropriate icon
    // Check for zero volume, comparing both exactly zero and very low values
    if (volume === 0 || audioElement.volume === 0) {
        muteIcon.style.display = "block"; // Show mute icon when volume is zero
    } else if (volume < 30) {
        lowIcon.style.display = "block";
    } else if (volume < 70) {
        midIcon.style.display = "block";
    } else {
        highIcon.style.display = "block";
    }
};

// Handles add/remove favorite when the heart is clicked
function handleHeartClick() {
    const heartIcon = document.querySelector('.heart-icon');
    const songId = heartIcon?.dataset.songId;

    if (!songId) return;

    if (heartIcon.classList.contains('active')) {
        // Remove from favorites
        fetch(`/api/user/favorites/${songId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    heartIcon.classList.remove('active');
                }
            })
            .catch(error => {
                console.error('Error removing from favorites:', error);
            });
    } else {
        // Add to favorites
        fetch(`/api/user/favorites/${songId}`, {
            method: 'POST'
        })
            .then(response => {
                if (response.ok) {
                    heartIcon.classList.add('active');
                }
            })
            .catch(error => {
                console.error('Error adding to favorites:', error);
            });
    }
}

// This function will be called when a play-song event is triggered
function playSong() {
    const audio = document.getElementById('songPlayer');
    if (audio) {
        console.log('Playing song');
        audio.play().catch(err => console.error('Error playing song:', err));
    }
}

// Add an event listener-to-heart icon
document.addEventListener('DOMContentLoaded', function () {
    const heartIcon = document.querySelector('.heart-icon');
    if (heartIcon) {
        heartIcon.addEventListener('click', handleHeartClick);
    }

    // Listen for play-song events from other components
    document.addEventListener('play-song', function (event) {
        const song = event.detail;
        if (!song) {
            console.error('No song data in play-song event');
            return;
        }

        console.log('Received play-song event:', song.title || song.id);

        // Make sure we have access to the MusicControl instance
        const musicControl = window.musicPlayer || new MusicControl(".playback");
        window.musicPlayer = musicControl; // Store it globally for other components

        // Load the song data into the player
        try {
            // If the song has a direct loadSong method, use it
            if (typeof musicControl.loadSong === 'function') {
                // Find the song index in the musicControl's song list
                const songIndex = musicControl.songList.findIndex(s =>
                    s.id.toString() === song.id.toString());

                if (songIndex !== -1) {
                    console.log('Loading song at index:', songIndex);
                    musicControl.loadSong(songIndex);
                    musicControl.handlePlay();
                } else {
                    console.log('Song not in list, trying to play directly');
                    // Direct audio element manipulation if the song isn't in the list
                    const audio = document.getElementById('songPlayer');
                    if (audio) {
                        const source = audio.querySelector('source');
                        if (source && song.file) {
                            source.src = song.file;
                            audio.load();
                            audio.play();
                        } else if (source && song.file) {
                            source.src = song.file;
                            audio.load();
                            audio.play();
                        }
                    }
                }
            } else {
                console.log('No loadSong method, playing directly');
                playSong();
            }
        } catch (error) {
            console.error('Error handling play-song event:', error);
        }
    });
});

// Function to initialize like button states for all song items on the album page
function initializeAlbumLikeButtons() {
    // Only proceed if we're on an album page
    if (!window.location.pathname.startsWith('/album')) return;
    
    fetch('/api/user/favorites')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch favorites');
            }
            return response.json();
        })
        .then(favorites => {
            // Get all like buttons on the page
            const likeBtns = document.querySelectorAll('.like-btn');
            
            likeBtns.forEach(btn => {
                const btnSongId = btn.dataset.songId;
                if (btnSongId) {
                    // Check if this song is in favorites
                    const isLiked = favorites.some(song => 
                        song.id.toString() === btnSongId.toString());
                    
                    // Update UI accordingly
                    const checkbox = btn.querySelector('.like-check');
                    if (checkbox) checkbox.checked = isLiked;
                    
                    btn.classList.toggle('liked', isLiked);
                    
                    const heartIcon = btn.querySelector('.fa-heart');
                    if (heartIcon) {
                        heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error initializing album like buttons:', error);
        });
}

// Helper function to save volume and muted state to Firestore
function saveVolumePreferences(volume, isMuted) {
    // Don't make API calls for minor volume changes, use a debounce approach
    if (window.volumeChangeTimeout) {
        clearTimeout(window.volumeChangeTimeout);
    }
    
    window.volumeChangeTimeout = setTimeout(() => {
        // Save volume and muted settings to user preferences in Firestore
        fetch('/api/user/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                volume: volume,
                isMuted: isMuted
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save audio preferences to Firestore');
            }
            console.log('Audio preferences saved to Firestore:', { volume, isMuted });
        })
        .catch(error => {
            console.error('Error saving audio preferences to Firestore:', error);
        });
    }, 1000); // Wait 1 second after the last change
    
    // Also save to localStorage as a fallback
    localStorage.setItem('playerVolume', volume.toString());
    localStorage.setItem('playerMuted', isMuted.toString());
}

// Update the loading function to also fetch muted state
const loadVolumeSettings = () => {
    return new Promise((resolve) => {
        // First try to get from Firestore
        fetch('/api/user/preferences')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch preferences from Firestore');
                }
                return response.json();
            })
            .then(preferences => {
                // Get volume and muted state from preferences
                if (preferences) {
                    console.log('Audio preferences loaded from Firestore:', preferences);
                    
                    // Update localStorage with the Firestore values
                    if (preferences.volume !== undefined) {
                        localStorage.setItem('playerVolume', preferences.volume.toString());
                    }
                    
                    if (preferences.isMuted !== undefined) {
                        localStorage.setItem('playerMuted', preferences.isMuted.toString());
                        
                        // Update song state for playback
                        const savedState = JSON.parse(localStorage.getItem("songState")) || {};
                        savedState.isMuted = preferences.isMuted;
                        localStorage.setItem("songState", JSON.stringify(savedState));
                    }
                    
                    // Determine volume to return
                    if (preferences.isMuted) {
                        resolve(0); // Return 0 if muted
                    } else if (preferences.volume !== undefined) {
                        resolve(parseInt(preferences.volume, 10));
                    } else {
                        throw new Error('Volume not found in Firestore preferences');
                    }
                } else {
                    throw new Error('No preferences found in Firestore');
                }
            })
            .catch(error => {
                console.log('Using localStorage fallback for volume:', error.message);
                // Fall back to localStorage
                const savedVolume = localStorage.getItem('playerVolume');
                const savedMuted = localStorage.getItem('playerMuted') === 'true';
                
                if (savedMuted) {
                    resolve(0); // Return 0 if muted in localStorage
                } else if (savedVolume !== null) {
                    resolve(parseInt(savedVolume, 10));
                } else {
                    // Default volume if nothing is saved
                    resolve(50);
                }
            });
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    // Get the initial song ID from the audio element
    const audioElement = document.getElementById('songPlayer');
    if (audioElement) {
        const initialSongId = audioElement.getAttribute('data-song-id');
        if (initialSongId) {
            // Update like button state for the initial song
            await updateLikeButtonState(initialSongId);
        }
    }

    // Initialize like buttons on album page if needed
    initializeAlbumLikeButtons();

    // Initialize the like buttons after getting the initial state
    toggleLike(".like-btn", ".like-check");

    // Create music control and make it globally available
    const musicControl = new MusicControl(".playback");
    window.musicPlayer = musicControl; // Make it available globally

    const volumeSlider = document.getElementById("seekVolume");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    // Load saved volume settings - now async from Firestore
    let currentVol = await loadVolumeSettings();
    let storedVolume = currentVol > 0 ? currentVol : 50; // Default to 50 if stored volume is 0

    // Initialize volume level and update icons
    updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);

    // Check if we need to initialize volume to zero because of mute state
    const savedState = JSON.parse(localStorage.getItem("songState"));
    if (savedState && savedState.isMuted) {
        currentVol = 0;
        updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
    }

    volumeIcons.forEach(icon => {
        icon.style.width = "20px";
        icon.style.cursor = "pointer";

        if (icon.id === "volume-two") {
            icon.style.position = "relative";
            icon.style.top = "1px";
        }

        icon.addEventListener("click", () => {
            if (musicControl.audio.volume === 0) {
                // If muted, restore volume to stored value
                currentVol = storedVolume;
                // Save unmuted state to Firestore
                saveVolumePreferences(currentVol, false);
            } else {
                // If not muted, store current volume, then mute
                storedVolume = currentVol > 0 ? currentVol : storedVolume;
                currentVol = 0;
                // Save muted state to Firestore
                saveVolumePreferences(currentVol, true);
            }
            
            // Update UI with new volume settings
            updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
            
            // Also update the saved state for page refresh handling
            const savedState = JSON.parse(localStorage.getItem("songState")) || {};
            savedState.isMuted = currentVol === 0;
            localStorage.setItem("songState", JSON.stringify(savedState));
        });
    });

    volumeSlider.addEventListener("input", () => {
        const newVolume = parseInt(volumeSlider.value, 10);
        
        // If volume was previously non-zero and is now zero, save the previous value
        if (currentVol > 0 && newVolume === 0) {
            storedVolume = currentVol;
        }
        
        currentVol = newVolume;
        
        // Save to Firestore with appropriate muted state
        saveVolumePreferences(currentVol, currentVol === 0);
        
        // Update UI
        updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
        
        // Also update the saved state for page refresh handling
        const savedState = JSON.parse(localStorage.getItem("songState")) || {};
        savedState.isMuted = currentVol === 0;
        localStorage.setItem("songState", JSON.stringify(savedState));
    });

    // Add favorite functionality
    const likeButton = document.querySelector('.like-icon');
    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            const songId = musicControl.audio.getAttribute('data-song-id');
            if (!songId) return;

            try {
                // Check if the song is already liked
                const isLiked = likeButton.classList.contains('liked');

                if (isLiked) {
                    // Remove from favorites
                    const response = await fetch(`/api/user/favorites/${songId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        likeButton.classList.remove('liked');
                        likeButton.style.color = 'white';
                    }
                } else {
                    // Add to favorites
                    const response = await fetch(`/api/user/favorites/${songId}`, {
                        method: 'POST'
                    });

                    if (response.ok) {
                        likeButton.classList.add('liked');
                        likeButton.style.color = '#ff3b5c';
                    }
                }
            } catch (error) {
                console.error('Error updating favorites:', error);
            }
        });
    }

    // Add an event listener for audio source changes
    if (musicControl && musicControl.audio) {
        // Listen for source changes
        musicControl.audio.addEventListener('loadeddata', function () {
            const songId = this.getAttribute('data-song-id');
            if (songId) {
                updateLikeButtonState(songId);
            }
        });
    }
});

// Listen for song-changed event
document.addEventListener('song-changed', async function (event) {
    const songData = event.detail;
    if (songData && songData.id) {
        // Update like button for the new song
        await updateLikeButtonState(songData.id);
        
        // Log the song change
        console.log(`Song changed to: ${songData.title} (ID: ${songData.id})`);
    }
});
