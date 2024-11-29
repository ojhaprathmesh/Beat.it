import { fetchSongData } from "../utility/fetchSongData.js";
import { insertSongs } from "../components/songs.js";
import { shuffle } from "../utility/shuffle.js";

document.addEventListener("DOMContentLoaded", async () => {
    const songData = await fetchSongData();
    await insertSongs(".song-row-1", shuffle(songData));
    await insertSongs(".song-row-2", shuffle(songData));
    const searchbar = document.querySelector(".searchbar")
    // console.log(searchbar.innerHTML);

    searchbar.addEventListener("input", (e)=>{
        const value = e.target.value;
        console.log(value);
    })

    const container = document.querySelector(".song-row-1")
    container.addEventListener("click", (e)=>{
        const songRowItem = e.target.closest(".song-row-item");   
        if (songRowItem) {
            console.log(songRowItem);
        }
    })

    const songRowItems = document.querySelectorAll('.song-title');
    const songRowItemsArray = Array.from(songRowItems);
    const innerHTMLArray = songRowItemsArray.map(item => item.innerHTML);
    console.log(innerHTMLArray);
})
