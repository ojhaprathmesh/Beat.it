import { insertPlayer } from "../components/playerElements.js";
import { SongControl } from "../classes/SongControl.js";
import { MusicControl } from "../classes/MusicControl.js";
import { VolumeSlider } from "../classes/VolumeSlider.js";

const toggleLike = (likeBtnSelector, checkboxSelector) => {
    const likeBtn = document.querySelector(likeBtnSelector);
    const checkbox = document.getElementById(checkboxSelector);

    likeBtn.addEventListener("click", () => {
        const isLiked = !checkbox.checked;
        checkbox.checked = isLiked;
        likeBtn.classList.toggle("liked", isLiked);
    });
};

const updateVolumeIcons = (volumeIcons, currentVolume) => {
    const [muteIcon, lowVolumeIcon, midVolumeIcon, highVolumeIcon] = volumeIcons;

    muteIcon.style.display = currentVolume === 0 ? "block" : "none";
    lowVolumeIcon.style.display = currentVolume > 0 && currentVolume < 30 ? "block" : "none";
    midVolumeIcon.style.display = currentVolume >= 30 && currentVolume < 70 ? "block" : "none";
    highVolumeIcon.style.display = currentVolume >= 70 ? "block" : "none";
};

document.addEventListener("DOMContentLoaded", async () => {
    await insertPlayer(".player");

    toggleLike(".like-btn", "like-check");

    const songControl = new SongControl();
    const musicControl = new MusicControl(".playbar", songControl);
    const volumeSlider = new VolumeSlider(".volume-control-bar");
    const volumeIcons = Array.from(document.querySelectorAll(".volume i"));

    volumeIcons.forEach(icon => icon.style.width = "20px");

    volumeSlider.volControl.addEventListener('volumeChange', (event) => {
        updateVolumeIcons(volumeIcons, event.detail);
    });
});
