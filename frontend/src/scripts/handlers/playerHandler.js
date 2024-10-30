import { insertPlayer } from "../components/playerElements.js";
import { SongControl } from "../classes/SongControl.js";
import { MusicControl } from "../classes/MusicControl.js";
import { ProgressSlider } from "../classes/ProgressSlider.js";

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtn = document.querySelector(likeBtnSelector);
    const checkbox = document.getElementById(checkboxSelector);

    likeBtn.addEventListener("click", () => {
        const isLiked = !checkbox.checked;
        checkbox.checked = isLiked;
        likeBtn.classList.toggle("liked", isLiked);
    });
};

const updateVolumeIcons = (currentVolume, volumeIcons, sliderInstance) => {
    const [muteIcon, lowVolumeIcon, midVolumeIcon, highVolumeIcon] = volumeIcons;
    let storedVolume = null; // To store the previous volume before muting

    const setIconVisibility = (mute, low, mid, high) => {
        muteIcon.style.display = mute ? "block" : "none";
        lowVolumeIcon.style.display = low ? "block" : "none";
        midVolumeIcon.style.display = mid ? "block" : "none";
        highVolumeIcon.style.display = high ? "block" : "none";
    };

    // Updates icon visibility based on current volume
    const updateIcons = (volume) => {
        setIconVisibility(
            volume === 0,                 // Mute icon if volume is 0
            volume > 0 && volume < 30,    // Low volume icon if volume is from 1 to 29
            volume >= 30 && volume < 70,  // Mid volume icon if volume is from 30 to 69
            volume >= 70                  // High volume icon if volume is 70 or above
        );
    };

    // Icon update
    updateIcons(currentVolume);
};

document.addEventListener("DOMContentLoaded", async () => {
    await insertPlayer(".player");

    toggleLike(".like-btn", "like-check");

    const songControl = new SongControl();
    const musicControl = new MusicControl(".playbar", songControl);
    const volumeSlider = new ProgressSlider(".volume-control-bar", ".volume-progress");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    volumeIcons.forEach(icon => {
        icon.style.width = "20px";
        icon.addEventListener("click", () => {
            if (icon.id != "volume-mute") {
                console.log(icon)
            }
        });
    });

    volumeSlider.volControl.addEventListener("volumeChange", (event) => {
        updateVolumeIcons(event.detail, volumeIcons, volumeSlider);
    });
});
