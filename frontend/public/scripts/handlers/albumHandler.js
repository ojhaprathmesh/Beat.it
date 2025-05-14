import {fetchSongData} from "../utility/fetchSongData.js";

// Function to get actual song duration
const getActualDuration = (file) => {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(audio.duration / 60);
            const seconds = Math.floor(audio.duration % 60);
            resolve(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        });

        // Set an error handler in case audio can't be loaded
        audio.addEventListener('error', () => {
            resolve("0:00"); // Default fallback duration
        });

        // Set timeout in case metadata never loads
        setTimeout(() => {
            resolve("0:00");
        }, 3000);

        audio.src = file;
    });
};

// Function to toggle favorite status for a song
const toggleFavorite = (songId, isLiked, likeBtn) => {
    if (!songId) {
        console.error("No song ID found for like button");
        return;
    }

    const checkbox = likeBtn.querySelector('.like-check');
    const heartIcon = likeBtn.querySelector('.fa-heart');
    
    // Update UI first
    checkbox.checked = isLiked;
    likeBtn.classList.toggle('liked', isLiked);
    if (heartIcon) {
        heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
    }

    // Update player's like button if this song is currently playing
    const audioElement = document.getElementById('songPlayer');
    const currentSongId = audioElement ? audioElement.getAttribute('data-song-id') : null;
    if (currentSongId === songId.toString()) {
        const playerLikeBtn = document.querySelector('.player .like-btn');
        if (playerLikeBtn) {
            const playerCheckbox = playerLikeBtn.querySelector('.like-check');
            if (playerCheckbox) playerCheckbox.checked = isLiked;
            playerLikeBtn.classList.toggle('liked', isLiked);
            
            const playerHeartIcon = playerLikeBtn.querySelector('.fa-heart');
            if (playerHeartIcon) {
                playerHeartIcon.style.color = isLiked ? "red" : "#FEFFF1";
            }
        }
    }

    // Make API call to update favorites
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
            likeBtn.classList.toggle('liked', !isLiked);
            if (heartIcon) {
                heartIcon.style.color = !isLiked ? "red" : "#FEFFF1";
            }
            alert(`Failed to ${isLiked ? 'add to' : 'remove from'} favorites. Please try again.`);
        });
};

document.addEventListener("DOMContentLoaded", async () => {
    const pathname = window.location.pathname;
    const isHomeOrSearch = ["/home", "/search"].includes(pathname);

    if (isHomeOrSearch) {
        try {
            document.querySelectorAll(".album-row-item").forEach(album => {
                album.addEventListener("click", () => {
                    const albumName = album.querySelector("img").alt;
                    window.location.href = `/album?name=${encodeURIComponent(albumName)}`;
                });
            });

            if (pathname === "/search") {
                document.querySelectorAll(".song-row-item").forEach(item => item.style.left = "250%");
            }
        } catch (error) {
            console.error("Error fetching song data:", error);
        }
    } else if (pathname.startsWith("/album")) {
        const albumName = new URLSearchParams(window.location.search).get("name");

        if (!albumName) {
            alert("No album name was given!");
            window.location.assign("/home");
            return;
        }

        try {
            // First fetch user's favorites to know which songs are liked
            let userFavorites = [];
            try {
                const favResponse = await fetch('/api/user/favorites');
                if (favResponse.ok) {
                    userFavorites = await favResponse.json();
                }
            } catch (error) {
                console.error("Error fetching user favorites:", error);
            }

            // Then fetch all song data
            const songData = await fetchSongData();
            const albumSongs = songData.filter((song) => song.album === albumName);

            if (albumSongs.length === 0) {
                alert("Invalid album name was given!");
                window.location.assign("/home");
                return;
            }

            // Set album songs in the music controller for album-specific functionality
            if (window.MusicControl) {
                const musicController = new window.MusicControl();
                // Set the album songs for album-specific behavior
                musicController.setAlbumSongs(albumSongs, albumName);
            }

            // Populate album details
            const albumDetails = document.querySelector(".album-details");
            if (albumDetails) {
                const albumCover = albumDetails.querySelector("img");
                const albumTitle = albumDetails.querySelector("h1");
                const albumArtist = albumDetails.querySelector("h4");

                albumCover.src = albumSongs[0].albumCover;
                albumCover.alt = albumName;
                albumTitle.textContent = albumName;
                albumArtist.textContent = albumSongs[0].artist.join(", ");
            }

            // Populate album songs
            const albumSongsContainer = document.querySelector(".album-songs");
            albumSongsContainer.innerHTML = ""; // Clear existing items

            // Create all song items with loading durations
            const songItems = await Promise.all(albumSongs.map(async (song, index) => {
                // Get actual duration if possible
                const actualDuration = await getActualDuration(song.file);
                
                // Check if this song is in user favorites
                const isLiked = userFavorites.some(favSong => 
                    favSong.id && song.id && favSong.id.toString() === song.id.toString());
                
                const songItem = document.createElement("div");
                songItem.className = "album-song-item";
                songItem.id = `song-${index + 1}`;
                songItem.innerHTML = `
                    <div class="index">${index + 1}.</div>
                    <div class="song-name">${song.title}</div>
                    <div class="song-duration">${actualDuration}</div>
                    <div class="like-btn ${isLiked ? 'liked' : ''}" data-song-id="${song.id}">
                        <i class="fas fa-heart" style="font-size: larger; color: ${isLiked ? 'red' : '#FEFFF1'}">
                            <input type="checkbox" class="like-check" ${isLiked ? 'checked' : ''} />
                        </i>
                    </div>
                `;

                // Add click listener for the song item (except like button)
                songItem.addEventListener("click", (e) => {
                    // Don't trigger song play if clicking on the like button
                    if (e.target.closest('.like-btn')) {
                        return;
                    }
                    
                    const songId = song.id;
                    
                    // Update player like button with this song's ID
                    const playerLikeBtn = document.querySelector('.player .like-btn');
                    if (playerLikeBtn) {
                        playerLikeBtn.dataset.songId = songId.toString();
                    }
                    
                    const songClickEvent = new CustomEvent("songClicked", {
                        detail: `${songId}`,
                    });
                    document.dispatchEvent(songClickEvent);
                });
                
                // Add specific listener for the like button
                const likeBtn = songItem.querySelector('.like-btn');
                if (likeBtn) {
                    likeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent the song item click
                        
                        const checkbox = likeBtn.querySelector('.like-check');
                        const newIsLiked = !checkbox.checked; // Toggle state
                        toggleFavorite(song.id, newIsLiked, likeBtn);
                    });
                }

                return songItem;
            }));

            // Append all song items to the container
            songItems.forEach(item => albumSongsContainer.appendChild(item));

        } catch (error) {
            console.error("Error setting up album page:", error);
        }
    }
});
