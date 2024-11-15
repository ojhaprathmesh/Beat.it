import { fetchSongData } from "../apis/fetchSongData.js";
import { insertSongs } from "../components/songs.js";

function shuffle(list) {
    // Fisher-Yates (or Knuth) shuffle algorithm
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

document.addEventListener("DOMContentLoaded", async () => {
    const songData = await fetchSongData();
    const len = songData.length;
    
    await insertSongs(".song-row-1", shuffle(songData));
    await insertSongs(".song-row-2", shuffle(songData));

    document.querySelectorAll(".song-rows > div > div").forEach((song, index) => {
        if (index > len - 1) {
            index = index - len;
        }
        const delay = `calc(${30}s / ${len} * ${len - index} * -1)`;
        song.style.animationDelay = delay;
        song.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("songClicked", {
                detail: song.id
            }));
        });
    });
});
