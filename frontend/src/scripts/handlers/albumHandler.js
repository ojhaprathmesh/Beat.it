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

                    const response = await fetch("http://localhost:3000/album/send-songs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ songsToPlay }),
                    });

                    if (!response) {
                        throw new Error("Failed to send album data to server.");
                    }

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
            const response = await fetch("http://localhost:3000/album/get-songs", {
                method: "POST"
            });
            const data = await response.json();
            const albumData = data.songs;

            const songNames = document.querySelectorAll(".album-song-item .song-name");
            const songDurations = document.querySelectorAll(".album-song-item .song-duration");

            for (let i = 0; i < songNames.length; i++) {
                songNames[i].innerText = albumData[i].title;
                songDurations[i].innerText = albumData[i].duration;
            }

            const coverImage = document.querySelector(".album-details img");
            coverImage.src = albumData[0].albumCover;

            const currentSong = document.querySelector(".album-details .current-song");
            currentSong.innerText = albumData[0].title;

            const albumName = document.querySelector(".album-details .album-name");
            albumName.innerText = albumData[0].album;

        } catch (error) {
            console.error("Error:", error)
        }
    }
});
