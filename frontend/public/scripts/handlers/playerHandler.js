import { MusicControl } from "../classes/MusicControl.js";

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtns = document.querySelectorAll(likeBtnSelector);

    likeBtns.forEach((likeBtn) => {
        // Remove the global selector that affects all heart icons
        // document.querySelector(".player-albuminfo .fa-heart").style.color = "#FEFFF1";

        likeBtn.addEventListener("click", () => {
            const checkbox = likeBtn.querySelector(checkboxSelector);
            const isLiked = !checkbox.checked;
            checkbox.checked = isLiked;
            likeBtn.classList.toggle("liked", isLiked);

            const parent = likeBtn.closest(".player-albuminfo");
            if (parent) {
                const heartIcon = likeBtn.querySelector(".fa-heart");
                if (heartIcon) {
                    heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
                }
            }
            
            // Get the song ID from the parent element or data attribute
            const songId = likeBtn.dataset.songId || (parent ? parent.dataset.songId : null);
            if (songId) {
                // Update server - save the like status
                fetch(`/api/user/favorites/${songId}`, {
                    method: isLiked ? 'POST' : 'DELETE'
                }).catch(error => {
                    console.error('Error updating favorite status:', error);
                });
            }
        });
    });
};


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

// Add event listener to heart icon
document.addEventListener('DOMContentLoaded', function() {
    const heartIcon = document.querySelector('.heart-icon');
    if (heartIcon) {
        heartIcon.addEventListener('click', handleHeartClick);
    }
    
    // Listen for play-song events from other components
    document.addEventListener('play-song', function(event) {
        const song = event.detail;
        if (song) {
            loadSong(song);
            playSong();
        }
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    toggleLike(".like-btn", ".like-check");

    const musicControl = new MusicControl(".playbar");
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

    // When song changes, check if it's in favorites
    document.addEventListener('songClicked', async (event) => {
        const songId = event.detail;
        
        // Check if song is in favorites
        try {
            const response = await fetch('/api/user/favorites');
            if (response.ok) {
                const favorites = await response.json();
                const isLiked = favorites.some(song => song.id === songId);
                
                if (likeButton) {
                    if (isLiked) {
                        likeButton.classList.add('liked');
                        likeButton.style.color = '#ff3b5c';
                    } else {
                        likeButton.classList.remove('liked');
                        likeButton.style.color = 'white';
                    }
                }
            }
        } catch (error) {
            console.error('Error checking favorites:', error);
        }
    });
});
