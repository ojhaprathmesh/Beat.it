import { fetchSongData } from "../apis/fetchSongData.js";

class SongControl {
    constructor() {
        this.songList = [];
        this.currentSongIndex = 0;
        this.loadSongCallCount = 0;
        this.audio = document.getElementById("songPlayer");
        this.seekBar = document.getElementById("seekBar");
        this.init();
    }

    async init() {
        try {
            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data

            const bindAfterMetaDataLoads = () => {
                this.updateSeekBar();
                this.audio.addEventListener("timeupdate", this.updateSeekBar.bind(this));
                this.seekBar.addEventListener("input", this.seekAudio.bind(this));
                this.audio.removeEventListener("loadedmetadata", bindAfterMetaDataLoads);
            };

            this.audio.addEventListener("loadedmetadata", bindAfterMetaDataLoads);

        } catch (error) {
            console.warn("Error fetching song data:", error);
        }
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

        this.seekBar.dispatchEvent(new CustomEvent("playNext", {
            detail: {
                value: this.seekBar.value
            }
        }));
    }

    // Allows the user to seek to a different part of the song
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

    playNext() {
        const nextIndex = this.currentSongIndex + 1;
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
}

export { SongControl };
