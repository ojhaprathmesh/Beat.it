import { fetchSongData } from "../apis/fetchSongData.js"; // Import the fetch function

class SongControl {
    constructor() {
        this.songList = [];
        this.currentSongIndex = 0;
        this.audio = new Audio(); // Audio element to play the song

        this.init();
    }

    async init() {
        try {
            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data
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

    playNext() {
        const nextIndex = (this.currentSongIndex + 1) % this.songList.length;

        if (nextIndex !== this.currentSongIndex) {
            this.loadSong(nextIndex);
            this.playSong();
        } else {
            this.pauseSong();
        }
    }

    playPrevious() {
        const previousIndex = (this.currentSongIndex - 1 + this.songList.length) % this.songList.length;
        this.loadSong(previousIndex);
        this.playSong();
    }

    convertDurationToSeconds(duration) {
        const [minutes, seconds] = duration.split(":").map(Number);
        return minutes * 60 + seconds;
    }

    getCurrentSongDuration() {
        return this.audio.duration;
    }
}

export { SongControl };
