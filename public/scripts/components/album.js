function renderAlbumCard(song) {
    return `
    <div class="album-row-item">
        <img src="${song.albumCover}" class="album-cover" alt="${song.album}" width="145px" height="145px">
        <p class="album-title font-syne">${song.album}</p>
    </div>
    `;
}

async function insertAlbums(containerSelector, songData) {
    const container = document.querySelector(containerSelector);
    if (container) {
        try {
            const albums = [];
            songData.forEach((song) => {
                if (!albums.includes(song.album)) {
                    albums.push(song.album)
                    container.innerHTML += renderAlbumCard(song);
                }
            });
        } catch (error) {
            console.warn("Error rendering album cards:", error);
        }
    }
}

export { insertAlbums };
