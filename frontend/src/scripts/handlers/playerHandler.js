import { insertPlayer } from "../components/player.js";
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

const updateVolumeIcons = (volume, volumeIcons) => {
    const [muteIcon, lowVolumeIcon, midVolumeIcon, highVolumeIcon] = volumeIcons;

    const setIconVisibility = (mute, low, mid, high) => {
        muteIcon.style.display = mute ? "block" : "none";
        lowVolumeIcon.style.display = low ? "block" : "none";
        midVolumeIcon.style.display = mid ? "block" : "none";
        highVolumeIcon.style.display = high ? "block" : "none";
    };

    setIconVisibility(
        volume == 0,                 // Show mute icon if volume is 0
        volume > 0 && volume < 30,    // Show low volume icon if volume is from 1 to 29
        volume >= 30 && volume < 70,  // Show mid volume icon if volume is from 30 to 69
        volume >= 70                  // Show high volume icon if volume is 70 or above
    );
};

document.addEventListener("DOMContentLoaded", async () => {
    await insertPlayer(".player"); // Wait for the player to be placed

    toggleLike(".like-btn", "like-check");

    const musicControl = new MusicControl(".playbar");
    const volumeSlider = document.getElementById("seekVolume");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    let currentVol = 50;
    let storedVolume = currentVol;
    volumeSlider.style.setProperty("--width-v", `${currentVol}px`);

    function updateVolSlider() {
        currentVol = volumeSlider.value;
        musicControl.audio.volume = currentVol / 100;
        volumeSlider.style.setProperty("--width-v", `${currentVol}px`);
        updateVolumeIcons(currentVol, volumeIcons);
    }

    volumeIcons.forEach(icon => {
        icon.style.width = "20px";

        if (icon.id === "volume-two") {
            icon.style.position = "relative";
            icon.style.top = "1px";
        }

        icon.addEventListener("click", () => {
            if (musicControl.audio.volume === 0) {
                // If muted, restore volume to stored value and update icons
                musicControl.audio.volume = storedVolume / 100;
                currentVol = storedVolume;
                volumeSlider.value = currentVol;
                updateVolumeIcons(currentVol, volumeIcons);
            } else {
                // If not muted, store current volume, mute audio, and update icons
                storedVolume = currentVol;
                musicControl.audio.volume = 0;
                currentVol = 0;
                volumeSlider.value = currentVol;
                updateVolumeIcons(0, volumeIcons);
            }
            volumeSlider.style.setProperty("--width-v", `${currentVol}px`);
        });
    });

    volumeSlider.addEventListener("input", () => {
        updateVolSlider();
    });
});
