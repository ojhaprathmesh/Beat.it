import { fetchSongData } from "../apis/fetchSongData.js";
import { insertSongs } from "../components/songs.js";

document.addEventListener("DOMContentLoaded", async () => {
    const songData = await fetchSongData();

    // Fisher-Yates (or Knuth) shuffle algorithm
    for (let i = songData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songData[i], songData[j]] = [songData[j], songData[i]];
    }

    insertSongs(".song-row", songData);
    document.querySelectorAll(".song-row > div").forEach(song => {
        song.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("songClicked", {
                detail: song.id
            }));
        });
    });
});
