class MusicControl {
    constructor(playbackSelector, songControlInstance) {
        this.controls = document.querySelector(`${playbackSelector} .controls`);

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
        this.songControl.seekBar.addEventListener("playNext", (event) => {
            const { value } = event.detail;
            if (Math.round(value) === 100) {
                this.handleForward();
            }
        });
    }

    // Utility function to toggle play/pause buttons
    togglePlayPause(isPlaying) {
        this.playBtn.style.display = isPlaying ? "none" : "block";
        this.pauseBtn.style.display = isPlaying ? "block" : "none";
    }

    handlePlay() {
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
        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);
        this.songControl.playPrevious();
    }

    handleForward() {
        this.isPlaying = this.songControl.playNext();
        this.togglePlayPause(this.isPlaying);
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
        const states = ['isnotRepeating', 'isSingleRepeat', 'isMultiRepeat'];
        this.stateIndex = 0; // Start with 'isnotRepeating'

        this[states[this.stateIndex]] = false; // Disable current state
        this.stateIndex = (this.stateIndex + 1) % states.length; // Move to next state
        this[states[this.stateIndex]] = true; // Enable next state

        console.log(this[states[0]])
        console.log(this[states[1]])
        console.log(this[states[2]])
    }
}

export { MusicControl };
