async function fetchSongData() {
    try {
        console.log('Fetching song data...');
        const response = await fetch("http://localhost:3000/api/data/songsData", {
            cache: "no-store", // Disable caching for fetch requests
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched song data:', data);
        return data;
    } catch (error) {
        console.error("Failed to fetch song data:", error);
        return []; // Returning an empty array to handle the error!
    }
}

export { fetchSongData };
