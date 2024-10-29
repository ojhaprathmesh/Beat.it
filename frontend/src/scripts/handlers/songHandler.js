import { fetchSongData } from "../apis/fetchSongData.js"; // Import the fetch function

class SongHandler {
    constructor(musicControl) {
        this.songList = []; // Initialize an empty array for the song list
        this.currentSongIndex = 0;
        this.musicControl = musicControl; // MusicControl instance
        this.audio = new Audio(); // Audio element to play the song

        this.init(); // Initialize and load song data
    }

    async init() {
        try {
            this.songList = await fetchSongData(); // Fetch song data from JSON
            this.loadSong(this.currentSongIndex); // Load the first song after fetching data
            this.bindEvents(); // Bind events after song data is loaded
        } catch (error) {
            console.error('Error fetching song data:', error);
        }
    }

    bindEvents() {
        this.musicControl.playBtn.addEventListener("click", () => this.playSong());
        this.musicControl.pauseBtn.addEventListener("click", () => this.pauseSong());
        this.musicControl.forwardBtn.addEventListener("click", () => this.playNext());
        this.musicControl.reverseBtn.addEventListener("click", () => this.playPrevious());

        this.audio.addEventListener("ended", () => this.playNext()); // Play next song when current ends
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
        // You can extend this to update other UI elements like artist name, album art, etc.
    }

    playSong() {
        if (this.audio.paused) {
            this.audio.play();
            this.musicControl.play(); // Sync MusicControl's play state
        }
    }

    pauseSong() {
        if (!this.audio.paused) {
            this.audio.pause();
            this.musicControl.pause(); // Sync MusicControl's pause state
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
}

export { SongHandler };
