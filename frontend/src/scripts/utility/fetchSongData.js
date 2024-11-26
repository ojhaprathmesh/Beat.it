function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60); // Extract the minutes
    const remainingSeconds = Math.floor(seconds % 60); // Extract the remaining seconds
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function fetchSongData() {
    try {
        const response = await fetch("http://localhost:3000/api/data/songsData");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        const getDuration = (file) => {
            return new Promise((resolve) => {
                const audio = new Audio(file);
                audio.addEventListener("loadedmetadata", () => {
                    resolve(audio.duration);
                });
            });
        };

        for (const song of data) {
            song.duration = formatTime(await getDuration(song.file));
        }

        return data;
    } catch (error) {
        console.warn("Failed to fetch song data:", error);
        return []; // Returning an empty array to handle the error!
    }
}

export { fetchSongData };
