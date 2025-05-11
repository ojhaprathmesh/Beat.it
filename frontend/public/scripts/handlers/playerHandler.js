import { MusicControl } from "../classes/MusicControl.js";

// Keep track of current song ID
let currentSongId = null;

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtns = document.querySelectorAll(likeBtnSelector);

    likeBtns.forEach((likeBtn) => {
        // Remove existing event listener first to prevent duplicates
        const newLikeBtn = likeBtn.cloneNode(true);
        likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);
        
        newLikeBtn.addEventListener("click", async (e) => {
            // Prevent default behavior
            e.preventDefault();
            e.stopPropagation();
            
            const checkbox = newLikeBtn.querySelector(checkboxSelector);
            const isLiked = !checkbox.checked;
            
            // Get the song ID from the audio element (most reliable source)
            const audioElement = document.getElementById('songPlayer');
            const songId = audioElement ? audioElement.getAttribute('data-song-id') : null;
            
            if (!songId) {
                console.error("No song ID found for like button");
                return;
            }
            
            try {
                // Update UI first for immediate feedback
                checkbox.checked = isLiked;
                newLikeBtn.classList.toggle("liked", isLiked);
                
                const heartIcon = newLikeBtn.querySelector(".fa-heart");
                if (heartIcon) {
                    heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
                }
                
                // Update server - save the like status
                const response = await fetch(`/api/user/favorites/${songId}`, {
                    method: isLiked ? 'POST' : 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to ${isLiked ? 'add' : 'remove'} favorite`);
                }
                
                console.log(`Song ${isLiked ? 'added to' : 'removed from'} favorites:`, songId);
                
                // Emit refresh event to update other parts of the UI
                if (window.socket) {
                    window.socket.emit('refresh-favorites', songId);
                }
            } catch (error) {
                console.error('Error updating favorite status:', error);
                // Revert UI changes on error
                checkbox.checked = !isLiked;
                newLikeBtn.classList.toggle("liked", !isLiked);
                if (heartIcon) {
                    heartIcon.style.color = !isLiked ? "red" : "#FEFFF1";
                }
                
                // Show an error notification
                alert(`Failed to ${isLiked ? 'add to' : 'remove from'} favorites. Please try again.`);
            }
        });
    });
};

// Update like button state based on the current song
async function updateLikeButtonState(songId) {
    if (!songId) return;
    
    // Store current song ID
    currentSongId = songId;
    
    try {
        // Get favorites
        const response = await fetch('/api/user/favorites');
        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }
        
        const favorites = await response.json();
        
        // Ensure we compare strings to strings for IDs
        const songIdStr = songId.toString();
        
        // Check if current song is in favorites
        const isLiked = favorites.some(song => {
            const favSongId = song.id ? song.id.toString() : '';
            return favSongId === songIdStr;
        });
        
        console.log(`Song ${songId} is ${isLiked ? 'liked' : 'not liked'}`);
        
        // Update all like buttons for this song
        const likeBtns = document.querySelectorAll('.like-btn');
        likeBtns.forEach(btn => {
            const checkbox = btn.querySelector('.like-check');
            if (checkbox) checkbox.checked = isLiked;
            btn.classList.toggle('liked', isLiked);
            
            const heartIcon = btn.querySelector('.fa-heart');
            if (heartIcon) {
                heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
            }
            
            // Update data-song-id attribute
            btn.dataset.songId = songIdStr;
        });
        
        // Ensure no page refresh is triggered
        return isLiked;
    } catch (error) {
        console.error('Error updating like button state:', error);
        return false;
    }
}

const updateVolumeUI = (volume, [muteIcon, lowIcon, midIcon, highIcon], audioElement, sliderElement) => {
    // Set audio volume and update slider
    audioElement.volume = volume / 100;
    sliderElement.value = volume;
    sliderElement.style.setProperty("--width-v", `${volume}%`);

    // Update icon visibility
    [muteIcon, lowIcon, midIcon, highIcon].forEach((icon, index) => {
        icon.style.display = [
            volume == 0,                // Mute icon
            volume > 0 && volume < 30,   // Low volume
            volume >= 30 && volume < 70, // Mid volume
            volume >= 70                 // High volume
        ][index] ? "block" : "none";
    });
};

// Add this function to check if a song is in favorites
async function checkIfFavorite(songId) {
    try {
        const response = await fetch('/api/user/favorites');
        
        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }
        
        const favorites = await response.json();
        return favorites.some(track => track.id === songId);
    } catch (error) {
        console.error('Error checking favorites:', error);
        return false;
    }
}

// Update the heart icon when a song is loaded
async function updateHeartIcon(songId) {
    const heartIcon = document.querySelector('.heart-icon');
    if (!heartIcon) return;
    
    heartIcon.dataset.songId = songId;
    
    try {
        const isFavorite = await checkIfFavorite(songId);
        if (isFavorite) {
            heartIcon.classList.add('active');
        } else {
            heartIcon.classList.remove('active');
        }
    } catch (error) {
        console.error('Error updating heart icon:', error);
    }
}

// Modify the loadSong function to update heart icon
function loadSong(song) {
    // ... existing code ...
    
    // Update heart icon state
    updateHeartIcon(song.id);
    
    // Dispatch song changed event for other components
    document.dispatchEvent(new CustomEvent('song-changed', { detail: song }));
    
    // ... existing code ...
}

// Handle add/remove favorite when heart is clicked
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

// Add event listener to heart icon
document.addEventListener('DOMContentLoaded', function() {
    const heartIcon = document.querySelector('.heart-icon');
    if (heartIcon) {
        heartIcon.addEventListener('click', handleHeartClick);
    }
    
    // Listen for play-song events from other components
    document.addEventListener('play-song', function(event) {
        const song = event.detail;
        if (!song) {
            console.error('No song data in play-song event');
            return;
        }
        
        console.log('Received play-song event:', song.title || song.id);
        
        // Make sure we have access to the MusicControl instance
        const musicControl = window.musicPlayer || new MusicControl(".playbar");
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
                        if (source && song.audioSrc) {
                            source.src = song.audioSrc;
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

    // Initialize the like buttons after getting the initial state
    toggleLike(".like-btn", ".like-check");

    // Create music control and make it globally available
    const musicControl = new MusicControl(".playbar");
    window.musicPlayer = musicControl; // Make it available globally
    
    const volumeSlider = document.getElementById("seekVolume");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    let currentVol = 50;
    let storedVolume = currentVol;

    // Initialize volume level and update icons
    updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);

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
            } else {
                // If not muted, store current volume, then mute
                storedVolume = currentVol;
                currentVol = 0;
            }
            updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
        });
    });

    volumeSlider.addEventListener("input", () => {
        currentVol = volumeSlider.value;
        updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
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

    // Add event listener for audio source changes
    if (musicControl && musicControl.audio) {
        // Listen for source changes
        musicControl.audio.addEventListener('loadeddata', function() {
            const songId = this.getAttribute('data-song-id');
            if (songId) {
                updateLikeButtonState(songId);
            }
        });
    }
});

// Listen for song-changed event
document.addEventListener('song-changed', async function(event) {
    const songData = event.detail;
    if (songData && songData.id) {
        // Update like button for the new song
        await updateLikeButtonState(songData.id);
        
        // Also update the data-song-id attribute on any like buttons
        const likeBtns = document.querySelectorAll('.like-btn');
        likeBtns.forEach(btn => {
            btn.setAttribute('data-song-id', songData.id);
        });
        
        console.log(`Song changed to: ${songData.title} (ID: ${songData.id})`);
    }
});
