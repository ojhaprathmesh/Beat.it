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
        this.seekBar = document.getElementById("seekMusic");
        this.audio = document.getElementById("songPlayer");
        this.audioSource = this.audio.querySelector("source");

        this.songList = [];
        this.currentSongIndex = 0;
        this.loadSongCallCount = 0;
        this.isPlaying = false;
        this.stateIndex = 0;
        this.isNotRepeating = true;
        this.repeatStates = ['isNotRepeating', 'isSingleRepeat', 'isMultiRepeat'];

        this.togglePlayPause(this.isPlaying);
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
        this.shuffleBtn.addEventListener("click", () => this.handleShuffle(this.songList));

        this.seekBar.addEventListener("updatedSeekbar", (event) => {
            const { value } = event.detail;
            if (Math.round(value) === 100) {
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
            this.songList.forEach(song => {
                const id = parseInt(event.detail);
                if ((this.currentSongIndex != (id - 1)) && (song.id == id)) {
                    this.loadSong(id - 1);
                }
            });
        });
    }

    loadSong(index) {
        if (index < 0 || index >= this.songList.length) {
            console.warn("Error: next song not found!");
            return;
        }

        this.currentSongIndex = index;
        const song = this.songList[index];
        this.audioSource.src = `../../../database/` + song.file;
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
            let finalName = '';

            if (song.artist.length > 1) {
                finalName = song.artist.map(name => name.split(' ')[0]).join(', ');
                finalName = finalName.substring(0, 22) + '...';
            } else {
                finalName = song.artist[0];
            }

            songArtistElement.textContent = finalName; // Update the song artist
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
        this.seekBar.value = parseFloat(progress.toFixed(2));

        const width = progress < 50 ? `calc(${5 * progress}px + 5px)` : `${5 * progress}px`;
        this.seekBar.style.setProperty("--width-m", width);

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

    async playSong() {
        try {
            if (this.audio.paused) {
                await this.audio.play();
            }
        } catch (error) {
            console.warn("Autoplay prevented: waiting for user interaction.");
            // Attach an event to retry play after user clicks anywhere on the page
            const playAfterInteraction = () => {
                this.audio.play().catch(error => console.warn("Autoplay still prevented.", error));
                this.isPlaying = true;
                this.togglePlayPause(this.isPlaying);
                document.removeEventListener("click", playAfterInteraction);
            };
            document.addEventListener("click", playAfterInteraction);
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

    handleShuffle(array) {
        this.shuffleBtn.style.animation = "shuffleAnimation 750ms forwards ease-in-out";
        this.shuffleBtn.addEventListener("animationend", () => {
            this.shuffleBtn.style.animation = "";
        }, { once: true });

        // Fisher-Yates (or Knuth) shuffle algorithm
        for (let i = array.length - 1; i > 0; i--) {
            // Generate a random index between 0 and i
            const j = Math.floor(Math.random() * (i + 1));

            // Swap elements at indices i and j
            [array[i], array[j]] = [array[j], array[i]];
        }

        this.playNext();
    }

    handleRepeat() {
        this.repeatStates.forEach((state) => this[state] = false);
        this.stateIndex = (this.stateIndex + 1) % 3;
        this[this.repeatStates[this.stateIndex]] = true;

        this.updateRepeatIcon(); // Update the repeat icon based on the new state
    }

    updateRepeatIcon() {
        const p = this.controls.querySelector("p");

        // Clear any previous animations or intervals
        if (this.repeatInterval) {
            clearInterval(this.repeatInterval);
        }

        if (this.isSingleRepeat) {
            p.textContent = "1";
            p.style.display = "block";
            this.repeatBtn.style.animation = ""; // No animation for single repeat
        } else if (this.isMultiRepeat) {
            p.textContent = "";
            p.style.display = "block";

            this.repeatInterval = setInterval(() => {
                this.repeatBtn.style.animation = this.repeatBtn.style.animation ? "" : "rotateClockwise 500ms linear forwards";
            }, 500);
        } else {
            p.style.display = "none";
            this.repeatBtn.style.animation = ""; // Clear animation for no repeat
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
        this.pauseBtn.style.display = isPlaying ? "block" : "none";
    }
}

export { MusicControl };
