import { fetchSongData } from "../apis/fetchSongData.js"; // Import the fetch function

class SongHandler {
    constructor() {
        this.songList = []; // Initialize an empty array for the song list
        this.currentSongIndex = 0;
        this.audio = new Audio(); // Audio element to play the song

        this.init(); // Initialize and load song data
    }

    async init() {
        try {
            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data
        } catch (error) {
            console.error('Error fetching song data:', error);
        }
    }

    loadSong(index) {
        if (index < 0 || index >= this.songList.length) {
            console.error("Invalid song index.");
            return;
        }

        this.currentSongIndex = index;
        const song = this.songList[index];
        this.audio.src = song.filePath; // Set the audio source to the selected song's file path
        this.audio.load();

        // Update UI, e.g., display song title
        this.updateSongUI(song);
    }

    updateSongUI(song) {
        const songTitleElement = document.querySelector(".song-title");
        if (songTitleElement) {
            songTitleElement.textContent = song.title; // Update the song title
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
        this.loadSong(nextIndex);
        this.playSong();
    }

    playPrevious() {
        const previousIndex = (this.currentSongIndex - 1 + this.songList.length) % this.songList.length;
        this.loadSong(previousIndex);
        this.playSong();
    }

    bindToMusicControl(musicControl) {
        this.musicControl = musicControl;
        this.musicControl.playBtn.addEventListener("click", () => this.playSong());
        this.musicControl.pauseBtn.addEventListener("click", () => this.pauseSong());
        this.musicControl.forwardBtn.addEventListener("click", () => this.playNext());
        this.musicControl.reverseBtn.addEventListener("click", () => this.playPrevious());

        this.audio.addEventListener("ended", () => this.playNext()); // Play next song when current ends
    }

    getCurrentSongDuration() {
        const song = this.songList[this.currentSongIndex];
        return song ? this.convertDurationToSeconds(song.duration) : 0; // Return duration in seconds
    }

    convertDurationToSeconds(duration) {
        const [minutes, seconds] = duration.split(':').map(Number);
        return minutes * 60 + seconds; // Convert to total seconds
    }
}

export { SongHandler };
