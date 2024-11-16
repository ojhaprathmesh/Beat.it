import { fetchSongData } from "../utility/fetchSongData.js";
import { insertAlbums } from "../components/album.js";
import { shuffle } from "../utility/shuffle.js";

document.addEventListener("DOMContentLoaded", async () => {
    const songData = await fetchSongData();

    await insertAlbums(".album-row", shuffle(songData));

    document.querySelectorAll(".album-row-item").forEach(album => {

    });
})