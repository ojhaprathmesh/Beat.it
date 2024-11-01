import { fetchSongData } from "../apis/fetchSongData.js"; // Import the fetch function

class SongControl {
    constructor() {
        this.songList = [];
        this.currentSongIndex = 0;
        this.audio = document.getElementById("songPlayer");  // Assuming "songPlayer" is your audio element ID
        this.seekBar = document.getElementById("seekBar");
        this.loadSongCallCount = 0;

        this.init();
    }

    async init() {
        try {
            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data

            // Add event listeners for seek bar after initialization
            this.audio.addEventListener("timeupdate", this.updateSeekBar.bind(this));
            this.seekBar.addEventListener("input", this.seekAudio.bind(this));
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
        this.seekBar.value = 0;

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
        this.seekBar.style.width = "100%";

        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.seekBar.value = progress;
        console.log(progress);
    }

    // Allows the user to seek to a different part of the song
    seekAudio() {
        const seekTime = (this.seekBar.value / 100) * this.audio.duration;
        this.audio.currentTime = seekTime;
        console.log(seekTime);
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
