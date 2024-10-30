class MusicControl {
    constructor(playbarSelector, songControlInstance) {
        this.progress = document.querySelector(`${playbarSelector} .music-progress`);
        this.controls = document.querySelector(`${playbarSelector} .controls`);

        this.songControl = songControlInstance; // Reference to SongControl object

        this.playBtn = this.controls.querySelector(".play");
        this.pauseBtn = this.controls.querySelector(".pause");
        this.reverseBtn = this.controls.querySelector(".reverse");
        this.forwardBtn = this.controls.querySelector(".forward");
        this.shuffleBtn = this.controls.querySelector(".shuffle");
        this.repeatBtn = this.controls.querySelector(".repeat");

        this.isPlaying = false;
        this.togglePlayPause(this.isPlaying);

        this.bindEvents();
    }

    bindEvents() {
        this.playBtn.addEventListener("click", () => this.handlePlay());
        this.pauseBtn.addEventListener("click", () => this.handlePause());
        this.forwardBtn.addEventListener("click", () => this.handleForward());
        this.reverseBtn.addEventListener("click", () => this.handleReverse());
        this.repeatBtn.addEventListener("click", () => this.handleRepeat());
        this.shuffleBtn.addEventListener("click", () => this.handleShuffle());
    }

    // Utility function to toggle play/pause buttons
    togglePlayPause(isPlaying) {
        this.playBtn.style.display = isPlaying ? "none" : "block";
        this.pauseBtn.style.display = isPlaying ? "block" : "none";
        this.progress.style.animationPlayState = isPlaying ? "running" : "paused";
    }

    handlePlay() {
        const duration = this.songControl.getCurrentSongDuration();
        this.progress.style.animation = `musicProgress ${duration}s linear forwards`;
        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);
        this.songControl.playSong();
    }

    handlePause() {
        this.isPlaying = false;
        this.togglePlayPause(this.isPlaying);
        this.songControl.pauseSong();
    }

    handleReverse() {
        const duration = this.songControl.getCurrentSongDuration();
        this.progress.style.animation = "none";
        this.progress.offsetHeight; // Trigger reflow to restart animation
        this.progress.style.animation = `musicProgress ${duration}s linear forwards`;

        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);
        this.songControl.playPrevious();
    }

    handleForward() {
        const duration = this.songControl.getCurrentSongDuration();
        this.progress.style.animation = "none";
        this.progress.offsetHeight; // Trigger reflow
        this.progress.style.animation = `musicProgress ${duration}s linear forwards`;

        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);
        this.songControl.playNext();
    }

    // Shuffle functionality (Work in progress)
    handleShuffle() {
        this.shuffleBtn.style.animation = "shuffleAnimation 0.5s forwards";
        this.shuffleBtn.addEventListener("animationend", () => {
            this.shuffleBtn.style.animation = "";
        }, { once: true }); // Ensuring this listener runs only once
    }

    // Repeat functionality (Work in progress)
    handleRepeat() {
        console.log("Repeat functionality not yet implemented.");
    }
}

export { MusicControl };
