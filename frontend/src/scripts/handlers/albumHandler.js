import { fetchSongData } from "../utility/fetchSongData.js";
import { insertAlbums } from "../components/album.js";
import { shuffle } from "../utility/shuffle.js";

document.addEventListener("DOMContentLoaded", async () => {
    const pathname = window.location.pathname;

    if (["/home", "/search"].includes(pathname)) {
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
        const params = new URLSearchParams(window.location.search);
        const albumName = params.get("name");

        if (!albumName) {
            console.error("Album name is missing in the query string.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/data/songsData");
            const albumData = await response.json();

            console.log(albumData);

            const filteredSongs = albumData.filter(song => song.album === albumName);

            if (filteredSongs.length === 0) {
                console.error("No songs found for this album.");
                return;
            }

            filteredSongs.forEach((song, i) => {
                document.querySelectorAll(".album-song-item .song-name")[i].innerText = song.title;
                document.querySelectorAll(".album-song-item .song-duration")[i].innerText = song.duration;
            });

            const albumDetails = document.querySelector(".album-details");
            albumDetails.querySelector("img").src = filteredSongs[0].albumCover;
            albumDetails.querySelector(".current-song").innerText = filteredSongs[0].title;
            albumDetails.querySelector(".album-name").innerText = albumName;
        } catch (error) {
            console.error("Error fetching album data:", error);
        }
    }
});
