document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".song-row-item").forEach((song) => {
        song.addEventListener("click", () => {
            document.dispatchEvent(
                new CustomEvent("songClicked", { detail: song.id })
            );
        });
    });
});
