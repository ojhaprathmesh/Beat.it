import { fetchSongData } from "../utility/fetchSongData.js";
import { insertAlbums } from "../components/album.js";
import { shuffle } from "../utility/shuffle.js";
import { MusicControl } from "../classes/MusicControl.js";

document.addEventListener("DOMContentLoaded", async () => {
    const pathname = window.location.pathname;
    const isHomeOrSearch = ["/home", "/search"].includes(pathname);

    if (isHomeOrSearch) {
        try {
            const songData = await fetchSongData();
            const shuffledSongs = shuffle(songData);
            await insertAlbums(".album-row", shuffledSongs);

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
            console.error("Album name is missing in the query string.");
            return;
        }

        try {
            const songData = await fetchSongData();
            const albumSongs = songData.filter(song => song.album === albumName);

            if (albumSongs.length === 0) {
                console.error(`No songs found for the album: ${albumName}`);
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

            albumSongs.forEach((song, index) => {
                const songItem = document.createElement("div");
                songItem.className = "album-song-item";
                songItem.innerHTML = `
                    <div class="index">${index + 1}.</div>
                    <div class="song-name">${song.title}</div>
                    <div class="song-duration">${song.duration}</div>
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

                albumSongsContainer.appendChild(songItem);
            });
        } catch (error) {
            console.error("Error setting up album page:", error);
        }
    }
});
