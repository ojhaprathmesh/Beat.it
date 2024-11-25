import { fetchSongData } from "../utility/fetchSongData.js";
import { insertAlbums } from "../components/album.js";
import { shuffle } from "../utility/shuffle.js";

document.addEventListener("DOMContentLoaded", async () => {
    const pathname = window.location.pathname;

    if (["/home", "/search"].includes(pathname)) {
        const songData = await fetchSongData();
        const shuffledSongs = shuffle(songData);

        await insertAlbums(".album-row", shuffledSongs);

        document.querySelectorAll(".album-row-item").forEach(album => {
            album.addEventListener("click", async () => {
                try {
                    const albumName = album.querySelector("img").alt;
                    const songsToPlay = shuffledSongs.filter(song => song.album === albumName);

                    const response = await fetch("http://localhost:3000/album/get-songs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ songsToPlay }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to send album data to server.");
                    }

                    // Navigate to the album page after successfully sending the data
                    window.location.href = "/album";
                } catch (error) {
                    console.error(`Error: ${error}`);
                }
            });
        });

        if (pathname === "/search") {
            document.querySelectorAll(".song-row-item").forEach(item => {
                item.style.left = "250%";
            });
        }
    } else if (pathname === "/album") {
        try {
            const response = await fetch("http://localhost:3000/album/send-songs", {
                method: "POST"
            });
            const data = await response.json();
            const albumData = data.songs;

            const songNames = document.querySelectorAll(".album-song-item .song-name");

            for (let i = 0; i < songNames.length; i++) {
                songNames[i].innerText = albumData[i].title;
            }

        } catch (error) {
            console.error("Error:", error)
        }
    }
});
