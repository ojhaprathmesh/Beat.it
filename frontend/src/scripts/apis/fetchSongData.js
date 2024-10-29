async function fetchSongData() {
    const response = await fetch('../../../database/data/songsData.json');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

export { fetchSongData };