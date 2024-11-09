import { fetchSongData } from "../apis/fetchSongData.js";

class MusicControl {
    constructor(playbackSelector) {
        this.controls = document.querySelector(`${playbackSelector} .controls`);
        this.playBtn = this.controls.querySelector(".play");
        this.pauseBtn = this.controls.querySelector(".pause");
        this.reverseBtn = this.controls.querySelector(".reverse");
        this.forwardBtn = this.controls.querySelector(".forward");
        this.shuffleBtn = this.controls.querySelector(".shuffle");
        this.repeatBtn = this.controls.querySelector(".repeat");
        this.seekBar = document.getElementById("seekBar");
        this.audio = document.getElementById("songPlayer");

        this.songList = [];
        this.currentSongIndex = 0;
        this.loadSongCallCount = 0;
        this.isPlaying = false;
        this.stateIndex = 0;
        this.repeatStates = ['isNotRepeating', 'isSingleRepeat', 'isMultiRepeat'];
        this.repeatStates.forEach((state) => this[state] = false);

        this.togglePlayPause(this.isPlaying);
        this.init();
    }

    async init() {
        try {
            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data

            const savedState = this.loadState();
            if (savedState) {
                this.applySavedState(savedState);
            }

            const bindAfterMetaDataLoads = () => {
                this.updateSeekBar();
                this.audio.addEventListener("timeupdate", this.updateSeekBar.bind(this));
                this.seekBar.addEventListener("input", this.seekAudio.bind(this));
                this.audio.removeEventListener("loadedmetadata", bindAfterMetaDataLoads);
            };

            this.audio.addEventListener("loadedmetadata", bindAfterMetaDataLoads);
            this.bindEvents();

        } catch (error) {
            console.warn("Error fetching song data:", error);
        }
    }

    bindEvents() {
        this.playBtn.addEventListener("click", () => this.handlePlay());
        this.pauseBtn.addEventListener("click", () => this.handlePause());
        this.forwardBtn.addEventListener("click", () => this.handleForward());
        this.reverseBtn.addEventListener("click", () => this.handleReverse());
        this.repeatBtn.addEventListener("click", () => this.handleRepeat());
        this.shuffleBtn.addEventListener("click", () => this.handleShuffle());
        this.seekBar.addEventListener("updatedSeekbar", (event) => {
            const { value } = event.detail;
            if (Math.round(value) === 100) {
                this.handleForward();
            }
        });
    }

    loadSong(index) {
        if (index < 0 || index >= this.songList.length) {
            console.warn("Error: next song not found!");
            return;
        }

        this.currentSongIndex = index;
        const song = this.songList[index];
        this.audio.src = `../../../database/` + song.filePath;
        this.audio.load();
        this.updateSongUI(song);

        if (this.loadSongCallCount === 0) {
            this.pauseSong();
        } else {
            this.playSong();
        }

        this.loadSongCallCount++;
    }

    updateSongUI(song) {
        const songTitleElement = document.querySelector(".player-songname");
        const songArtistElement = document.querySelector(".player-artistname");
        const songAlbumElement = document.querySelector(".player-songcover img");

        if (songTitleElement) {
            songTitleElement.textContent = song.title; // Update the song title
        }

        if (songArtistElement) {
            songArtistElement.textContent = song.artist; // Update the song artist
        }

        if (songAlbumElement) {
            songAlbumElement.src = song.imagePath;
        }
    }

    updateSeekBar() {
        if (isNaN(this.audio.duration) || this.audio.duration === 0) {
            console.warn(isNaN(this.audio.duration)
                ? "Waiting for audio duration to be set..."
                : "ZeroAudioDurationError!"
            );
            return;
        }

        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.seekBar.value = parseFloat(progress.toFixed(2));

        const width = progress < 50 ? `calc(${5 * progress}px + 5px)` : `${5 * progress}px`;
        this.seekBar.style.setProperty("--width", width);

        const color = this.audio.currentTime <= 1 ? "var(--grey)" : "var(--white)";
        this.seekBar.style.setProperty("--color", color);

        this.seekBar.dispatchEvent(new CustomEvent("updatedSeekbar", {
            detail: {
                value: this.seekBar.value
            }
        }));

        this.saveState();
    }

    seekAudio() {
        if (!isNaN(this.audio.duration)) {
            const seekTime = (parseFloat(this.seekBar.value / 100)) * this.audio.duration;
            this.audio.currentTime = seekTime;
        }
    }

    playSong() {
        if (this.audio.paused) {
            this.audio.play();
        }
    }

    pauseSong() {
        if (!this.audio.paused) {
            this.audio.pause();
        }
    }

    handlePlay() {
        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);
        this.playSong();
    }

    handlePause() {
        this.isPlaying = false;
        this.togglePlayPause(this.isPlaying);
        this.pauseSong();
    }

    handleReverse() {
        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);
        this.playPrevious();
    }

    handleForward() {
        this.isPlaying = this.playNext();
        this.togglePlayPause(this.isPlaying);
    }

    playNext() {
        let nextIndex = this.currentSongIndex + 1;
        if (this.isSingleRepeat) {
            nextIndex = this.currentSongIndex;
        } else if (this.isMultiRepeat) {
            nextIndex = (this.currentSongIndex + 1) % this.songList.length;
        }
        return nextIndex < this.songList.length
            ? (this.loadSong(nextIndex), true)
            : (this.endCurrentSong(), false);
    }

    playPrevious() {
        const previousIndex = this.audio.currentTime < 5
            ? (this.currentSongIndex - 1 < 0 ? 0 : this.currentSongIndex - 1)
            : this.currentSongIndex;

        this.loadSong(previousIndex);
        this.playSong();
    }

    endCurrentSong() {
        if (!isNaN(this.audio.duration)) {
            this.audio.currentTime = this.audio.duration;
            this.pauseSong();
        }
    }

    handleShuffle() {
        this.shuffleBtn.style.animation = "shuffleAnimation 750ms forwards ease-in-out";
        this.shuffleBtn.addEventListener("animationend", () => {
            this.shuffleBtn.style.animation = "";
        }, { once: true });
    }

    handleRepeat() {
        this.stateIndex = (this.stateIndex + 1) % this.repeatStates.length;
        this[this.repeatStates[this.stateIndex]] = true;

        const p = this.controls.querySelector("p");

        if (this.repeatInterval) {
            clearInterval(this.repeatInterval);
        }

        if (this.isSingleRepeat) {
            p.textContent = "1";
            p.style.display = "block";
        } else if (this.isMultiRepeat) {
            p.textContent = "";
            p.style.display = "block";

            this.repeatInterval = setInterval(() => {
                if (this.repeatBtn.style.animation != "") {
                    this.repeatBtn.style.animation = "";
                } else {
                    this.repeatBtn.style.animation = "rotateClockwise 500ms linear forwards";
                }
            }, 500);
        } else {
            p.style.display = "none";
            setTimeout(() => {
                this.repeatBtn.style.animation = "";
            }, 500);
        }
    }

    loadState() {
        const songState = JSON.parse(localStorage.getItem("songState"));
        return songState;
    }

    saveState() {
        const songState = {
            songIndex: this.currentSongIndex,
            ellapsedTime: this.audio.currentTime,
            isPlaying: !this.audio.paused,
            loadSongCallCount: this.loadSongCallCount,
            stateIndex: this.stateIndex,
            isNotRepeating: this.isNotRepeating,
            isSingleRepeat: this.isSingleRepeat,
            isMultiRepeat: this.isMultiRepeat
        };
        localStorage.setItem("songState", JSON.stringify(songState));
    }

    applySavedState(savedState) {
        this.currentSongIndex = savedState.songIndex;
        this.loadSong(this.currentSongIndex);

        this.audio.currentTime = savedState.ellapsedTime;
        this.loadSongCallCount = savedState.loadSongCallCount;

        this.stateIndex = savedState.stateIndex;
        this.isNotRepeating = savedState.isNotRepeating;
        this.isSingleRepeat = savedState.isSingleRepeat;
        this.isMultiRepeat = savedState.isMultiRepeat;

        this.isPlaying = savedState.isPlaying;
        this.togglePlayPause(this.isPlaying);

        if (this.isPlaying) {
            this.pauseSong();
        } else {
            this.playSong();
        }
    }

    togglePlayPause(isPlaying) {
        this.playBtn.style.display = isPlaying ? "none" : "block";
        this.pauseBtn.style.display = isPlaying ? "block" : "none";
    }
}

export { MusicControl };
