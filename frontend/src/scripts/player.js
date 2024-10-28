import { insertPlayer } from "../components/playerRenderer.js";

class VolumeSlider {
    constructor(volumeSelector) {
        this.volumeBar = document.querySelector(volumeSelector);
        this.circle = null;
        this.isDragging = false;

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        this.volumeBar.addEventListener("mouseenter", (e) => this.onMouseEnter(e));
        this.volumeBar.addEventListener("mouseleave", () => this.onMouseLeave());
        this.volumeBar.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.volumeBar.addEventListener("mouseup", (e) => this.onMouseUp(e));
        this.volumeBar.addEventListener("mousemove", (e) => this.onMouseMove(e));
    }

    onMouseEnter(e) {
        if (!this.circle) {
            this.circle = document.createElement("div");
            this.circle.classList.add("circle");

            const barDimensions = this.volumeBar.getBoundingClientRect();
            const progressDimensions = this.volumeBar.querySelector(".progress").getBoundingClientRect();
            const minPosition = progressDimensions.left - progressDimensions.right;
            let maxPosition = minPosition + progressDimensions.width - 14;
            let currentPosition = e.clientX - barDimensions.right + 14;

            // Set initial circle position
            this.circle.style.left = `${Math.max(minPosition, Math.min(currentPosition, maxPosition))}px`;
            this.volumeBar.appendChild(this.circle);

            // Trigger animation
            requestAnimationFrame(() => {
                this.circle.classList.add("show");
            });
        }
    }

    onMouseLeave() {
        if (this.circle) {
            this.circle.classList.remove("show");

            setTimeout(() => {
                this.circle.remove();
                this.circle = null;
            }, 400); // Match transition timing
        }
    }

    onMouseDown(e) {
        if (e.button === 0) {
            this.isDragging = true;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.isDragging = false;
        }
    }

    onMouseMove(e) {
        if (this.isDragging && this.circle) {
            const barDimensions = this.volumeBar.getBoundingClientRect();
            const progressDimensions = this.volumeBar.querySelector(".progress").getBoundingClientRect();
            const minPosition = progressDimensions.left - progressDimensions.right;
            const maxPosition = minPosition + progressDimensions.width - 14;
            let currentPosition = e.clientX - barDimensions.right + 14;

            // Move the circle within the allowed range
            this.circle.style.left = `${Math.max(minPosition, Math.min(currentPosition, maxPosition))}px`;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    insertPlayer(".player");

    // Like button functionality
    const likeBtn = document.querySelector(".like-btn");
    const checkbox = document.getElementById("like-check");

    likeBtn.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked; // Toggle the checkbox
        likeBtn.classList.toggle("liked", checkbox.checked);
    });

    // Music functionalities
    const progress = document.querySelector(".playbar .progress");
    const songControl = document.querySelector(".controls");

    const playBtn = songControl.querySelector(".play");
    const pauseBtn = songControl.querySelector(".pause");
    const reverseBtn = songControl.querySelector(".reverse");
    const forwardBtn = songControl.querySelector(".forward");
    const shuffleBtn = songControl.querySelector(".shuffle");
    const repeatBtn = songControl.querySelector(".repeat");

    let isPlaying = true;

    // Utility function to toggle play/pause buttons
    function togglePlayPause(isPlaying) {
        playBtn.style.display = isPlaying ? "none" : "block";
        pauseBtn.style.display = isPlaying ? "block" : "none";
        progress.style.animationPlayState = isPlaying ? "running" : "paused";
    }

    // Play button functionality
    playBtn.addEventListener("click", () => {
        if (!isPlaying) {
            togglePlayPause(true);
            isPlaying = true;
        }
    });

    // Pause button functionality
    pauseBtn.addEventListener("click", () => {
        if (isPlaying) {
            togglePlayPause(false);
            isPlaying = false;
        }
    });

    // Reverse button functionality
    reverseBtn.addEventListener("click", () => {
        progress.style.animation = "none";
        progress.offsetHeight; // Trigger reflow to restart animation
        progress.style.animation = "musicProgress 30s linear forwards";
        togglePlayPause(true);
        isPlaying = true;
    });

    // Forward button functionality
    forwardBtn.addEventListener("click", () => {
        progress.style.animation = "none";
        progress.offsetHeight;
        progress.style.animation = "musicProgress 0s linear forwards";
        togglePlayPause(false);
        isPlaying = false;
    });

    // Shuffle button functionality
    shuffleBtn.addEventListener("click", () => {
        shuffleBtn.style.animation = "shuffleAnimation 0.5s forwards";

        shuffleBtn.addEventListener("animationend", () => {
            shuffleBtn.style.animation = "";
        }, { once: true }); // Ensure this listener runs only once
    });


    // Repeat button functionality (Work in progress)
    repeatBtn.addEventListener("click", () => {
        console.log("Repeat functionality not yet implemented.");
    });

    const volumeSlider = new VolumeSlider(".volume .progress-bar");
});
