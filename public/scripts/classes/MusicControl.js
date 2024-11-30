import { fetchSongData } from "../utility/fetchSongData.js";
import { shuffle } from "../utility/shuffle.js";

class MusicControl {
    constructor() {
        this.controls = document.querySelector(`.playbar .controls`);
        this.albumControls = document.querySelector(`.album-content .controls`);
        this.playBtn = this.controls.querySelector(".play");
        this.albumPlayBtn = this.albumControls.querySelector(".play");
        this.pauseBtn = this.controls.querySelector(".pause");
        this.albumPauseBtn = this.albumControls.querySelector(".pause");
        this.reverseBtn = this.controls.querySelector(".reverse");
        this.forwardBtn = this.controls.querySelector(".forward");
        this.shuffleBtn = this.controls.querySelector(".shuffle");
        this.repeatBtn = this.controls.querySelector(".repeat");
        this.seekBar = document.getElementById("seekMusic");
        this.audio = document.getElementById("songPlayer");
        this.audioSource = this.audio.querySelector("source");

        this.songList = [];
        this.currentSongIndex = 0;
        this.loadSongCallCount = 0;
        this.stateIndex = 0;
        this.isNotRepeating = true;
        this.repeatStates = ['isNotRepeating', 'isSingleRepeat', 'isMultiRepeat'];

        this.init();
    }

    async init() {
        try {
            const bindAfterMetaDataLoads = () => {
                this.updateSeekBar();
                this.audio.addEventListener("timeupdate", this.updateSeekBar.bind(this));
                this.seekBar.addEventListener("input", this.seekAudio.bind(this));
                this.audio.removeEventListener("loadedmetadata", bindAfterMetaDataLoads);
            };
            this.audio.addEventListener("loadedmetadata", bindAfterMetaDataLoads);

            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data

            const savedState = this.loadState();
            if (savedState) {
                this.applySavedState(savedState);
            }

            this.bindEvents();
            this.handlePause();

        } catch (error) {
            console.warn("Error fetching song data:", error);
        }
    }

    bindEvents() {
        this.playBtn.addEventListener("click", () => this.handlePlay());
        this.albumPlayBtn.addEventListener("click", () => this.handlePlay());
        this.pauseBtn.addEventListener("click", () => this.handlePause());
        this.albumPauseBtn.addEventListener("click", () => this.handlePause());
        this.forwardBtn.addEventListener("click", () => this.handleForward());
        this.reverseBtn.addEventListener("click", () => this.handleReverse());
        this.repeatBtn.addEventListener("click", () => this.handleRepeat());
        this.shuffleBtn.addEventListener("click", () => this.handleShuffle(this.songList));

        this.seekBar.addEventListener("updatedSeekbar", (event) => {
            if (Math.round(event.detail) === 100) {
                this.handleForward();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.code === "Space") {
                event.preventDefault();
                this.isPlaying ? this.handlePause() : this.handlePlay();
            }
        });

        document.addEventListener("songClicked", (event) => {
            const id = parseInt(event.detail) - 1; // Calculate once
            const song = this.songList.find(song => song.id === id + 1);

            if (song) {
                if (this.currentSongIndex === id) {
                    this.handlePlay();
                } else {
                    this.loadSong(id); // Load the new song
                    this.handlePlay(); // Play it
                }
            }
        });

        // window.addEventListener("beforeunload", function (event) {
        //     const message = "You are about to leave Music Paradise.";
        //     event.returnValue = message;
        //     return message;
        // });
    }

    loadSong(index) {
        if (index < 0 || index >= this.songList.length) {
            console.warn("Error: song not found!");
            return;
        }

        this.currentSongIndex = index;
        const song = this.songList[index];
        this.audioSource.src = song.file;
        this.audio.load();
        this.updateSongUI(song);

        this.loadSongCallCount === 0
            ? this.handlePause()
            : this.handlePlay

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
            const finalName = song.artist.length > 1
                ? song.artist.map(name => name.split(' ')[0]).join(', ').substring(0, 22) + '...'
                : song.artist[0];

            songArtistElement.textContent = finalName;
        }

        if (songAlbumElement) {
            songAlbumElement.src = song.albumCover;
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
        const width = progress < 50 ? `calc(${5 * progress}px + 5px)` : `${5 * progress}px`;

        this.seekBar.value = parseFloat(progress.toFixed(2));
        this.seekBar.style.setProperty("--width-m", width);
        this.seekBar.style.setProperty("--color", "var(--white)");

        this.seekBar.dispatchEvent(new CustomEvent("updatedSeekbar", {
            detail: this.seekBar.value
        }));

        this.saveState();
    }

    seekAudio() {
        if (!isNaN(this.audio.duration)) {
            const seekTime = (parseFloat(this.seekBar.value / 100)) * this.audio.duration;
            this.audio.currentTime = seekTime;
        }
    }

    handlePlay() {
        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);

        // Attempt to play the song
        try {
            if (this.audio.paused) {
                this.audio.play().catch(() => {
                    console.warn("Autoplay prevented. Waiting for user interaction.");

                    const playAfterInteraction = () => {
                        this.audio.play().catch(err => console.warn("Autoplay still prevented.", err));
                        this.isPlaying = true;
                        this.togglePlayPause(this.isPlaying);
                        document.removeEventListener("click", playAfterInteraction);
                    };

                    document.addEventListener("click", playAfterInteraction);
                });
            }
        } catch (error) {
            console.error("Error playing song:", error);
        }
    }

    handlePause() {
        this.isPlaying = false;
        this.togglePlayPause(this.isPlaying);
        if (!this.audio.paused) {
            this.audio.pause();
        }
    }

    handleReverse() {
        const previousIndex = this.audio.currentTime < 5
            ? this.isSingleRepeat || (this.currentSongIndex === 0 && !this.isMultiRepeat)
                ? this.currentSongIndex
                : (this.currentSongIndex - 1 + this.songList.length) % this.songList.length
            : this.currentSongIndex;

        this.loadSong(previousIndex);
        this.handlePlay();
    }

    handleForward() {
        let nextIndex = this.isSingleRepeat
            ? this.currentSongIndex
            : this.isMultiRepeat
                ? (this.currentSongIndex + 1) % this.songList.length
                : this.currentSongIndex + 1;

        if (nextIndex < this.songList.length) {
            this.loadSong(nextIndex);
            this.handlePlay();
        } else {
            if (!isNaN(this.audio.duration)) {
                this.audio.currentTime = this.audio.duration;
                this.handlePause();
            }
        }
    }

    handleShuffle(array) {
        this.shuffleBtn.style.animation = "shuffleAnimation 750ms forwards ease-in-out";
        this.shuffleBtn.addEventListener("animationend", () => {
            this.shuffleBtn.style.animation = "";
        }, { once: true });

        const currentSong = array[this.currentSongIndex];
        const remainingSongs = array.filter((_, index) => index !== this.currentSongIndex);

        shuffle(remainingSongs);

        const shuffledArray = [currentSong, ...remainingSongs];
        this.songList = shuffledArray;
    }

    handleRepeat() {
        this.repeatStates.forEach((state) => this[state] = false);
        this.stateIndex = (this.stateIndex + 1) % 3;
        this[this.repeatStates[this.stateIndex]] = true;

        this.updateRepeatIcon(); // Update the repeat icon based on the new state
    }

    updateRepeatIcon() {
        const p = this.controls.querySelector("p");

        // Clear previous interval and animation
        clearInterval(this.repeatInterval);
        this.repeatBtn.style.animation = "";

        if (this.isSingleRepeat) {
            p.textContent = "1";
            p.style.display = "block";
        } else if (this.isMultiRepeat) {
            p.textContent = "";
            p.style.display = "block";
            this.repeatInterval = setInterval(() => {
                this.repeatBtn.style.animation = this.repeatBtn.style.animation ? "" : "rotateClockwise 500ms linear forwards";
            }, 500);
        } else {
            p.style.display = "none";
        }
    }

    loadState() {
        const songState = JSON.parse(localStorage.getItem("songState"));
        return songState;
    }

    saveState() {
        if (this.songList.length === 0 || this.currentSongIndex >= this.songList.length) {
            console.warn("Cannot save state: Song list is empty or index is out of bounds.");
            return;
        }

        const currentSong = this.songList[this.currentSongIndex];
        const songState = {
            lastSongPlayed: currentSong ? currentSong.id : null,
            ellapsedTime: this.audio ? this.audio.currentTime : 0,
            loadSongCallCount: this.loadSongCallCount,
            stateIndex: this.stateIndex,
            isNotRepeating: this.isNotRepeating,
            isSingleRepeat: this.isSingleRepeat,
            isMultiRepeat: this.isMultiRepeat
        };

        localStorage.setItem("songState", JSON.stringify(songState));
    }

    applySavedState(savedState) {
        this.currentSongIndex = savedState.lastSongPlayed - 1;
        this.loadSong(this.currentSongIndex);

        this.audio.currentTime = savedState.ellapsedTime;
        this.loadSongCallCount = savedState.loadSongCallCount;

        this.stateIndex = savedState.stateIndex;
        this.isNotRepeating = savedState.isNotRepeating;
        this.isSingleRepeat = savedState.isSingleRepeat;
        this.isMultiRepeat = savedState.isMultiRepeat;

        this.updateRepeatIcon();
    }

    togglePlayPause(isPlaying) {
        this.playBtn.style.display = isPlaying ? "none" : "block";
        this.albumPlayBtn.style.display = isPlaying ? "none" : "block";
        this.pauseBtn.style.display = isPlaying ? "block" : "none";
        this.albumPauseBtn.style.display = isPlaying ? "block" : "none";
    }
}

export { MusicControl };
