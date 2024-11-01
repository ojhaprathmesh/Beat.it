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
            console.error("Error fetching song data:", error);
        }
    }

    loadSong(index) {
        if (index < 0 || index >= this.songList.length) {
            console.error("Error: next song not found!");
            return;
        }

        this.currentSongIndex = index;
        const song = this.songList[index];
        this.audio.src = song.filePath;
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

        if (songTitleElement) {
            songTitleElement.textContent = song.title; // Update the song title
        }

        if (songArtistElement) {
            songArtistElement.textContent = song.artist; // Update the song artist
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

    // Updates the seek bar as the song plays
    updateSeekBar() {
        if (isNaN(this.audio.duration) || this.audio.duration === 0) {
            console.assert(!isNaN(this.audio.duration), "Waiting for audio duration to be set...");
            console.error(this.audio.duration === 0 ? "ZeroAudioDurationError!" : "");
            return;
        }

        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.seekBar.value = parseFloat(progress.toFixed(2));
        this.seekBar.style.setProperty('--progress', progress);
    }

    // Allows the user to seek to a different part of the song
    seekAudio() {
        const seekTime = (parseFloat(this.seekBar.value / 100)) * this.audio.duration;
        this.audio.currentTime = seekTime;
    }

    playNext() {
        const nextIndex = this.currentSongIndex + 1;
        return nextIndex < this.songList.length
            ? (this.loadSong(nextIndex), true)
            : (this.endCurrentSong(), false);
    }

    endCurrentSong() {
        this.audio.currentTime = this.audio.duration;
        this.pauseSong();
    }

    playPrevious() {
        const previousIndex = this.audio.currentTime < 5
            ? (this.currentSongIndex - 1 < 0 ? 0 : this.currentSongIndex - 1)
            : this.currentSongIndex;

        this.loadSong(previousIndex);
        this.playSong();
    }
}

export { SongControl };
