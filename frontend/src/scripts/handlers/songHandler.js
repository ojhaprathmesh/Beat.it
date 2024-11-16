import { fetchSongData } from "../utility/fetchSongData.js";
import { insertSongs } from "../components/songs.js";
import { shuffle } from "../utility/shuffle.js";

document.addEventListener("DOMContentLoaded", async () => {
    const songData = await fetchSongData();
    const len = songData.length;

    await insertSongs(".song-row-1", shuffle(songData));
    await insertSongs(".song-row-2", shuffle(songData));

    document.querySelectorAll(".song-row-item").forEach((song, index) => {
        if (index > len - 1) {
            index = index - len;
        }

        const duration = "30s";
        const delay = `calc(${duration} / ${len} * ${len - index} * -1)`;
        song.style.animationDelay = delay;
        song.style.setProperty("--duration", duration);

        song.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("songClicked", {
                detail: song.id
            }));
        });
    });
});
