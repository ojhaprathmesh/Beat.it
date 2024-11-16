import { fetchSongData } from "../utility/fetchSongData.js";
import { insertAlbums } from "../components/album.js";

document.addEventListener("DOMContentLoaded", async () => {
    const songData = await fetchSongData();

    await insertAlbums(".album-row", songData);

    document.querySelectorAll(".album-row-item").forEach(album => {

    });
})