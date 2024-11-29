document.addEventListener("DOMContentLoaded", () => {
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

    
})
