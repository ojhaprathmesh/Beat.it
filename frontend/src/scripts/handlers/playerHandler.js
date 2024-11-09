import { insertPlayer } from "../components/player.js";
import { MusicControl } from "../classes/MusicControl.js";

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtn = document.querySelector(likeBtnSelector);
    const checkbox = document.getElementById(checkboxSelector);

    likeBtn.addEventListener("click", () => {
        const isLiked = !checkbox.checked;
        checkbox.checked = isLiked;
        likeBtn.classList.toggle("liked", isLiked);
    });
};

const updateVolumeUI = (volume, volumeIcons, audioElement, sliderElement) => {
    // Set audio volume
    audioElement.volume = volume / 100;
    sliderElement.value = volume;
    sliderElement.style.setProperty("--width-v", `${volume}px`);

    // Update icons based on volume level
    const [muteIcon, lowVolumeIcon, midVolumeIcon, highVolumeIcon] = volumeIcons;

    const setIconVisibility = (mute, low, mid, high) => {
        muteIcon.style.display = mute ? "block" : "none";
        lowVolumeIcon.style.display = low ? "block" : "none";
        midVolumeIcon.style.display = mid ? "block" : "none";
        highVolumeIcon.style.display = high ? "block" : "none";
    };

    setIconVisibility(
        volume == 0,                 // Show mute icon if volume is 0
        volume > 0 && volume < 30,   // Show low volume icon if volume is from 1 to 29
        volume >= 30 && volume < 70, // Show mid volume icon if volume is from 30 to 69
        volume >= 70                 // Show high volume icon if volume is 70 or above
    );
};

document.addEventListener("DOMContentLoaded", async () => {
    await insertPlayer(".player");   // Wait for the player to be placed

    toggleLike(".like-btn", "like-check");

    const musicControl = new MusicControl(".playbar");
    const volumeSlider = document.getElementById("seekVolume");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    let currentVol = 50;
    let storedVolume = currentVol;

    // Initialize volume level and update icons
    updateVolumeUI(currentVol, volumeIcons, musicControl.audio, volumeSlider);

    volumeIcons.forEach(icon => {
        icon.style.width = "20px";

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
