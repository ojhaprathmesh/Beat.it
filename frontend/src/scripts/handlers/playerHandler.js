import { insertPlayer } from "../components/playerElements.js";
import { SongHandler } from "./songHandler.js";

class MusicControl {
    constructor(playbarSelector) {
        this.progress = document.querySelector(`${playbarSelector} .progress`);
        this.songControl = document.querySelector(`${playbarSelector} .controls`);

        this.playBtn = this.songControl.querySelector(".play");
        this.pauseBtn = this.songControl.querySelector(".pause");
        this.reverseBtn = this.songControl.querySelector(".reverse");
        this.forwardBtn = this.songControl.querySelector(".forward");
        this.shuffleBtn = this.songControl.querySelector(".shuffle");
        this.repeatBtn = this.songControl.querySelector(".repeat");

        this.isPlaying = true;

        this.bindEvents();
    }

    bindEvents() {
        this.playBtn.addEventListener("click", () => this.play());
        this.pauseBtn.addEventListener("click", () => this.pause());
        this.reverseBtn.addEventListener("click", () => this.reverse());
        this.forwardBtn.addEventListener("click", () => this.forward());
        this.shuffleBtn.addEventListener("click", () => this.shuffle());
        this.repeatBtn.addEventListener("click", () => this.repeat());
    }

    // Utility function to toggle play/pause buttons
    togglePlayPause(isPlaying) {
        this.playBtn.style.display = isPlaying ? "none" : "block";
        this.pauseBtn.style.display = isPlaying ? "block" : "none";
        this.progress.style.animationPlayState = isPlaying ? "running" : "paused";
    }

    play() {
        if (!this.isPlaying) {
            this.togglePlayPause(true);
            this.isPlaying = true;
        }
    }

    pause() {
        if (this.isPlaying) {
            this.togglePlayPause(false);
            this.isPlaying = false;
        }
    }

    reverse() {
        this.progress.style.animation = "none";
        this.progress.offsetHeight; // Trigger reflow to restart animation
        this.progress.style.animation = `musicProgress 30s linear forwards`;
        this.togglePlayPause(true);
        this.isPlaying = true;
    }

    forward() {
        this.progress.style.animation = "none";
        this.progress.offsetHeight;
        this.progress.style.animation = "musicProgress 0s linear forwards";
        this.togglePlayPause(false);
        this.isPlaying = false;
    }

    shuffle() {
        this.shuffleBtn.style.animation = "shuffleAnimation 0.5s forwards";
        this.shuffleBtn.addEventListener("animationend", () => {
            this.shuffleBtn.style.animation = "";
        }, { once: true }); // Ensure this listener runs only once
    }

    // Repeat functionality (Work in progress)
    repeat() {
        console.log("Repeat functionality not yet implemented.");
    }
}

class VolumeSlider {
    constructor(volumeSelector) {
        this.circle = null;
        this.circleWidth = 0;
        this.circleDimensions = null;

        this.volControl = document.querySelector(volumeSelector);
        this.volControlDimensions = this.volControl.getBoundingClientRect();
        this.volProgress = this.volControl.querySelector(".volume-progress")
        this.volProgressDimensions = this.volProgress.getBoundingClientRect();
        this.outputVolume = this.volProgressDimensions.width;

        this.minPosition = 0;
        this.maxPosition = 0;
        this.isDragging = false;

        this.bindEvents();
    }

    bindEvents() {
        this.volControl.addEventListener("mouseenter", () => this.onMouseEnter());
        this.volControl.addEventListener("mouseleave", () => this.onMouseLeave());
        this.volControl.addEventListener("mousedown", (e) => this.onMouseDown(e));

        // Track mouse movements and releases globally
        document.addEventListener("mousemove", (e) => this.onMouseMove(e));
        document.addEventListener("mouseup", (e) => this.onMouseUp(e));
    }

    acquireCircleDimensions() {
        if (this.circle) {
            this.circleDimensions = this.circle.getBoundingClientRect();
            this.circleWidth = this.circleDimensions.width;

            this.minPosition = this.volProgressDimensions.left;
            this.maxPosition = this.volProgressDimensions.right - this.circleWidth;
        }
    }

    updateCirclePosition(mouseX) {
        const halfCircleWidth = this.circleWidth / 2;
        const currentPosition = mouseX - halfCircleWidth;
        this.maxPosition = this.volControlDimensions.right - this.circleWidth;
        const newPosition = Math.max(this.minPosition, Math.min(currentPosition, this.maxPosition));
        this.circle.style.left = `${newPosition}px`;

        this.updateOutputVolume(newPosition);
    }

    onMouseEnter() {
        // Create the circle indicator if it doesn't exist and if not dragging
        if (!this.circle && !this.isDragging) {
            this.circle = document.createElement("div");
            this.circle.classList.add("circle");

            this.circle.style.transform = "translateY(-50%)"; // Vertically center the circle

            this.volControl.appendChild(this.circle);

            requestAnimationFrame(() => {
                this.acquireCircleDimensions(); // Acquire dimensions after the circle is rendered
                this.circle.style.left = `${Math.max(this.volControlDimensions.x, Math.min(this.outputVolume + (this.volControlDimensions.x - this.circleWidth / 2), this.volControlDimensions.right - this.circleWidth))}px`;

                // Animate the circle's appearance
                if (this.circle) {
                    this.circle.classList.add("show");
                }
            });
        }
    }

    onMouseLeave() {
        if (this.isDragging) {
            document.querySelector("body").style.cursor = "grabbing";
        }

        // Remove the circle when the mouse leaves, unless dragging
        if (this.circle && !this.isDragging) {
            this.circle.classList.remove("show");

            this.volProgress.style.borderTopRightRadius = `5px`;
            this.volProgress.style.borderBottomRightRadius = `5px`;
            setTimeout(() => {
                if (this.circle) {
                    this.circle.remove();
                    this.circle = null;
                }
            }, 500);
        }
    }

    onMouseDown(e) {
        // Start dragging if the left mouse button is pressed
        if (e.button === 0) {
            this.isDragging = true;
            this.circle.style.cursor = "grabbing";
            e.preventDefault();
        }
    }

    onMouseUp(e) {
        document.querySelector("body").style.cursor = "auto";

        // Stop dragging and reset the cursor when the mouse button is released
        if (e.button === 0) {
            this.isDragging = false;
            if (this.circle) {
                this.circle.style.cursor = "grab";
            }

            if (!this.volControl.contains(e.target)) {
                if (this.circle && !this.isDragging) {
                    this.circle.classList.remove("show");

                    this.volProgress.style.borderTopRightRadius = `5px`;
                    this.volProgress.style.borderBottomRightRadius = `5px`;
                    setTimeout(() => {
                        if (this.circle) {
                            this.circle.remove();
                            this.circle = null;
                        }
                    }, 500);
                }
            }
        }
    }

    onMouseMove(e) {
        if (this.isDragging && this.circle) {
            this.updateCirclePosition(e.clientX);
            e.preventDefault(); // Prevent other default actions
        }
    }

    updateOutputVolume(mouseX) {
        const newMin = 0;
        const newMax = 100;
        const offsetX = mouseX - this.volControlDimensions.x;
        const originalMin = this.minPosition - this.volControlDimensions.x;
        const originalMax = this.maxPosition - this.volControlDimensions.x;

        const newVolume = ((offsetX - originalMin) * (newMax - newMin)) / (originalMax - originalMin); // y = ((x-a)*(d-c))/(b-a) + c

        this.outputVolume = Math.round((newVolume) * 2) / 2;
        this.setVolume(this.volProgress.style);

        // This emits a custom event whenever volume is updated
        const volumeEvent = new CustomEvent('volumeChange', { detail: this.outputVolume });
        this.volControl.dispatchEvent(volumeEvent);
    }

    setVolume(volProgress) {
        if (volProgress && typeof this.outputVolume === "number") {
            if (this.outputVolume < 25) {
                volProgress.borderTopRightRadius = 0;
                volProgress.borderBottomRightRadius = 0;
            }
            if (this.outputVolume > 95) {
                volProgress.borderTopRightRadius = `5px`;
                volProgress.borderBottomRightRadius = `5px`;
            }
            volProgress.width = `${this.outputVolume}%`;
        }
    }

    getVolume() {
        return this.outputVolume;
    }
}

function toggleLike(likeBtnSelector, checkboxSelector) {
    const likeBtn = document.querySelector(likeBtnSelector);
    const checkbox = document.getElementById(checkboxSelector);

    likeBtn.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked; // Toggle the like state
        likeBtn.classList.toggle("liked", checkbox.checked);
    });
}

const updateVolumeIcons = (currentVolume) => {
    const [muteIcon, lowVolumeIcon, midVolumeIcon, highVolumeIcon] = volumeIcons;

    muteIcon.style.display = currentVolume === 0 ? "block" : "none";
    lowVolumeIcon.style.display = currentVolume > 0 && currentVolume < 30 ? "block" : "none";
    midVolumeIcon.style.display = currentVolume >= 30 && currentVolume < 70 ? "block" : "none";
    highVolumeIcon.style.display = currentVolume >= 70 ? "block" : "none";
};

document.addEventListener("DOMContentLoaded", async () => {
    await insertPlayer(".player");

    toggleLike(".like-btn", "like-check");

    const musicControl = new MusicControl(".playbar");
    const songHandler = new SongHandler();
    songHandler.bindToMusicControl(musicControl);

    const volumeSlider = new VolumeSlider(".volume-control-bar");
    const volumeIcons = document.querySelector(".volume").getElementsByTagName("i");

    Array.from(volumeIcons).forEach(icon => {
        icon.style.width = "20px";
    });

    volumeSlider.volControl.addEventListener('volumeChange', (event) => {
        updateVolumeIcons(event.detail);
    });
});

export { MusicControl };