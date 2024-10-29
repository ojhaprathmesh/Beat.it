import { insertPlayer } from "../components/playerRenderer.js";

class MusicControl {
    constructor(playbarSelector, controlsSelector) {
        this.progress = document.querySelector(`${playbarSelector} .progress`);
        this.songControl = document.querySelector(controlsSelector);

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
        this.progress.style.animation = "musicProgress 30s linear forwards";
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

        this.volumeBar = document.querySelector(volumeSelector);
        this.volumeBarDimensions = this.volumeBar.getBoundingClientRect();
        this.progressDimensions = this.volumeBar.querySelector(".progress").getBoundingClientRect();
        this.outputVolume = this.progressDimensions.width;

        this.minPosition = 0;
        this.maxPosition = 0;
        this.isDragging = false;

        this.bindEvents();
    }

    bindEvents() {
        this.volumeBar.addEventListener("mouseenter", () => this.onMouseEnter());
        this.volumeBar.addEventListener("mouseleave", () => this.onMouseLeave());
        this.volumeBar.addEventListener("mousedown", (e) => this.onMouseDown(e));

        // Track mouse movements and releases globally
        document.addEventListener("mousemove", (e) => this.onMouseMove(e));
        document.addEventListener("mouseup", (e) => this.onMouseUp(e));
    }

    updateOutputVolume(mouseX) {
        const newMin = 0;
        const newMax = 100;
        const offsetX = mouseX - this.volumeBarDimensions.x;
        const originalMin = this.minPosition - this.volumeBarDimensions.x;
        const originalMax = this.maxPosition - this.volumeBarDimensions.x;
        console.log(originalMin, originalMax, this.volumeBarDimensions.x);

        const newVolume = ((offsetX - originalMin) * (newMax - newMin)) / (originalMax - originalMin);
        // y = ((x-a)*(d-c))/(b-a) + c

        this.outputVolume = Math.round((newVolume) * 2) / 2;
        console.log(this.outputVolume);
    }

    updateCirclePosition(mouseX) {
        const halfCircleWidth = this.circleWidth / 2;
        const currentPosition = mouseX - halfCircleWidth;
        this.maxPosition = this.volumeBarDimensions.right - this.circleWidth;
        const newPosition = Math.max(this.minPosition, Math.min(currentPosition, this.maxPosition));
        this.circle.style.left = `${newPosition}px`;

        this.updateOutputVolume(newPosition);
    }

    acquireCircleDimensions() {
        if (this.circle) {
            this.circleDimensions = this.circle.getBoundingClientRect();
            this.circleWidth = this.circleDimensions.width;

            this.minPosition = this.progressDimensions.left;
            this.maxPosition = this.progressDimensions.right - this.circleWidth;
        }
    }

    onMouseEnter() {
        // Create the circle indicator if it doesn't exist and if not dragging
        if (!this.circle && !this.isDragging) {
            this.circle = document.createElement("div");
            this.circle.classList.add("circle");

            this.circle.style.transform = "translateY(-50%)"; // Vertically center the circle

            this.volumeBar.appendChild(this.circle);

            requestAnimationFrame(() => {
                this.acquireCircleDimensions(); // Acquire dimensions after the circle is rendered
                this.circle.style.left = `${this.maxPosition}px`;

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

            if (!this.volumeBar.contains(e.target)) {
                if (this.circle) {
                    this.circle.classList.remove("show");
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
}

document.addEventListener("DOMContentLoaded", () => {
    insertPlayer(".player");

    // Like button functionality
    const likeBtn = document.querySelector(".like-btn");
    const checkbox = document.getElementById("like-check");

    likeBtn.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked; // Toggle the like state
        likeBtn.classList.toggle("liked", checkbox.checked);
    });

    const musicControl = new MusicControl(".playbar", ".controls");
    const volumeSlider = new VolumeSlider(".volume .progress-bar");
});
