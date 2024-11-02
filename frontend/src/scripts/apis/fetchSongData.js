async function fetchSongData() {
    try {
        const response = await fetch("../../../database/data/songsData.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn("Failed to fetch song data:", error);
        return []; // Returning an empty array to handle the error!
    }
}

export { fetchSongData }