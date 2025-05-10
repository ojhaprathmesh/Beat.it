import { fetchSongData } from "../utility/fetchSongData.js";

// Function to get actual song duration
const getActualDuration = (audioSrc) => {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(audio.duration / 60);
            const seconds = Math.floor(audio.duration % 60);
            resolve(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        });
        
        // Set error handler in case audio can't be loaded
        audio.addEventListener('error', () => {
            resolve("0:00"); // Default fallback duration
        });
        
        // Set timeout in case metadata never loads
        setTimeout(() => {
            resolve("0:00");
        }, 3000);
        
        audio.src = audioSrc;
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
            const songData = await fetchSongData();
            const albumSongs = songData.filter((song) => song.album === albumName);

            if (albumSongs.length === 0) {
                alert("Invalid album name was given!");
                window.location.assign("/home");
                return;
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
                
                const songItem = document.createElement("div");
                songItem.className = "album-song-item";
                songItem.id = `song-${index + 1}`;
                songItem.innerHTML = `
                    <div class="index">${index + 1}.</div>
                    <div class="song-name">${song.title}</div>
                    <div class="song-duration">${actualDuration}</div>
                    <div class="like-btn">
                        <i class="fas fa-heart" style="font-size: larger;">
                            <input type="checkbox" class="like-check" />
                        </i>
                    </div>
                `;

                // Add click listener for song item
                songItem.addEventListener("click", () => {
                    const songClickEvent = new CustomEvent("songClicked", {
                        detail: `${song.id}`,
                    });
                    document.dispatchEvent(songClickEvent);
                });

                return songItem;
            }));
            
            // Append all song items to the container
            songItems.forEach(item => albumSongsContainer.appendChild(item));
            
        } catch (error) {
            console.error("Error setting up album page:", error);
        }
    }
});
