import { insertPlayer } from "../components/player.js";
import { MusicControl } from "../classes/MusicControl.js";

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtns = document.querySelectorAll(likeBtnSelector);

    likeBtns.forEach((likeBtn) => {
        document.querySelector(".player-albuminfo .fa-heart").style.color = "#FEFFF1";

        likeBtn.addEventListener("click", () => {
            const checkbox = likeBtn.querySelector(checkboxSelector);
            const isLiked = !checkbox.checked;
            checkbox.checked = isLiked;
            likeBtn.classList.toggle("liked", isLiked);

            const parent = likeBtn.closest(".player-albuminfo");
            if (parent) {
                const heartIcon = likeBtn.querySelector(".fa-heart");
                if (heartIcon) {
                    heartIcon.style.color = isLiked ? "red" : "#FEFFF1";
                }
            }
        });
    });
};


const updateVolumeUI = (volume, [muteIcon, lowIcon, midIcon, highIcon], audioElement, sliderElement) => {
    // Set audio volume and update slider
    audioElement.volume = volume / 100;
    sliderElement.value = volume;
    sliderElement.style.setProperty("--width-v", `calc(${volume}px ${volume > 50 ? '' : "+ 5px"})`);

    // Update icon visibility
    [muteIcon, lowIcon, midIcon, highIcon].forEach((icon, index) => {
        icon.style.display = [
            volume === 0,                // Mute icon
            volume > 0 && volume < 30,   // Low volume
            volume >= 30 && volume < 70, // Mid volume
            volume >= 70                 // High volume
        ][index] ? "block" : "none";
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    await insertPlayer(".player");       // Wait for the player to be placed

    toggleLike(".like-btn", ".like-check");

    const musicControl = new MusicControl(".playbar");
    const volumeSlider = document.getElementById("seekVolume");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    let currentVol = 50;
    let storedVolume = currentVol;

    // Initialize volume level and update icons
    updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);

    volumeIcons.forEach(icon => {
        icon.style.width = "20px";
        icon.style.cursor = "pointer";

        if (icon.id === "volume-two") {
            icon.style.position = "relative";
            icon.style.top = "1px";
        }

        icon.addEventListener("click", () => {
            if (musicControl.audio.volume === 0) {
                // If muted, restore volume to stored value
                currentVol = storedVolume;
            } else {
                // If not muted, store current volume, then mute
                storedVolume = currentVol;
                currentVol = 0;
            }
            updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
        });
    });

    volumeSlider.addEventListener("input", () => {
        currentVol = volumeSlider.value;
        updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);
    });
});
