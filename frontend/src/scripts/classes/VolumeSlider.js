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

export { VolumeSlider };
