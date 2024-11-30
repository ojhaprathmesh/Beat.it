function renderSongCard(song) {
    return `
    <div class="song-row-item" id=${song.id}>
        <img src=${song.albumCover} class="song-cover" alt="${song.title}"
            width="75px" height="75px">
        <div class="title-artist font-syne">
            <div class="song-title">${song.title}</div>
            <div class="album-name">${song.album}</div>
        </div>
    </div>
    `;
}

async function insertSongs(containerSelector, songData) {
    const container = document.querySelector(containerSelector);
    if (container) {
        try {
            songData.forEach((song) => {
                container.innerHTML += renderSongCard(song);
            });
        } catch (error) {
            console.warn("Error rendering song cards:", error);
        }
    }
}

export { insertSongs };
