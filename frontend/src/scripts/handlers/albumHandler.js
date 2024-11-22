import { fetchSongData } from "../utility/fetchSongData.js";
import { insertAlbums } from "../components/album.js";
import { shuffle } from "../utility/shuffle.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (["/home", "/search"].includes(window.location.pathname)) {
        const songData = await fetchSongData();
        const shuffledSongs = shuffle(songData);

        await insertAlbums(".album-row", shuffledSongs);

        document.querySelectorAll(".album-row-item").forEach(album => {
            album.addEventListener("click", async () => {
                const albumName = album.querySelector("img").alt;
                const songsToPlay = shuffledSongs.filter(song => song.album === albumName);
            });
        });

        if (window.location.pathname === "/search") {
            document.querySelectorAll(".song-row-item").forEach((item) => { 
                item.style.left = "250%";
            })
        }
    }
});
