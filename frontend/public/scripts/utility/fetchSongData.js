function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60); // Extract the minutes
    const remainingSeconds = Math.floor(seconds % 60); // Extract the remaining seconds
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function fetchSongData() {
    try {
        const response = await fetch("http://localhost:3000/api/data/songsData", {
            cache: "no-store", // Disable caching for fetch requests
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // const getDuration = (file) => {
        //     return new Promise((resolve) => {
        //         const audio = new Audio(file);
        //         audio.addEventListener("loadedmetadata", () => {
        //             resolve(audio.duration);
        //         });
        //     });
        // };
        //
        // // Calculate durations and update data
        // for (const song of data) {
        //     song.duration = formatTime(await getDuration(song.file));
        // }
        //
        // // Send updated data to the server
        // const updateResponse = await fetch("http://localhost:3000/api/data/update-durations", {
        //     method: "PUT",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ songs: data }),
        // });
        //
        // if (!updateResponse.ok) {
        //     console.warn("Failed to update durations on the server:", updateResponse.status);
        // }

        return await response.json();
    } catch (error) {
        console.warn("Failed to fetch song data:", error);
        return []; // Returning an empty array to handle the error!
    }
}

export {fetchSongData};
