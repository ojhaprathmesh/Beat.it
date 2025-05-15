import {fetchSongData} from "../utility/fetchSongData.js";
import {shuffle} from "../utility/shuffle.js";

class MusicControl {
    constructor() {
        this.controls = document.querySelector(`.playback .controls`);
        this.playBtn = this.controls.querySelector(".play");
        this.pauseBtn = this.controls.querySelector(".pause");
        this.reverseBtn = this.controls.querySelector(".reverse");
        this.forwardBtn = this.controls.querySelector(".forward");
        this.shuffleBtn = this.controls.querySelector(".shuffle");
        this.repeatBtn = this.controls.querySelector(".repeat");
        this.seekBar = document.getElementById("seekMusic");
        this.audio = document.getElementById("songPlayer");
        this.audioSource = this.audio.querySelector("source");

        this.albumControls = document.querySelector(`.album-content .controls`);
        if (this.albumControls) {
            this.albumPlayBtn = this.albumControls.querySelector(".play");
            this.albumPauseBtn = this.albumControls.querySelector(".pause");
            this.albumShuffleBtn = this.albumControls.querySelector(".shuffle");
            this.albumRepeatBtn = this.albumControls.querySelector(".repeat");
        }

        this.songList = [];
        this.albumSongs = []; // Store album songs separately
        this.currentSongIndex = 0;
        this.loadSongCallCount = 0;
        this.stateIndex = 0;
        this.isNotRepeating = true;
        this.repeatStates = ['isNotRepeating', 'isSingleRepeat', 'isMultiRepeat'];
        this.isShuffling = false;
        this.currentAlbum = null; // Track current album

        this.init().then(() => {
            console.log("MusicControl initialized successfully!");
        }).catch(e => console.error("Error initializing MusicControl:", e));
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
        this.pauseBtn.addEventListener("click", () => this.handlePause());
        this.forwardBtn.addEventListener("click", () => this.handleForward());
        this.reverseBtn.addEventListener("click", () => this.handleReverse());
        this.repeatBtn.addEventListener("click", () => this.handleRepeat());
        this.shuffleBtn.addEventListener("click", () => this.handleShuffle(this.songList));

        if (this.albumControls) {
            this.albumPlayBtn.addEventListener("click", () => this.handleAlbumPlay());
            this.albumPauseBtn.addEventListener("click", () => this.handlePause());
            this.albumShuffleBtn.addEventListener("click", () => this.handleAlbumShuffle());
            this.albumRepeatBtn.addEventListener("click", () => this.handleAlbumRepeat());
        }

        this.seekBar.addEventListener("updatedSeekbar", (event) => {
            if (Math.round(event.detail) === 100) {
                this.handleForward();
            }
        });

        document.addEventListener("keydown", (event) => {
            const searchInput = document.getElementById("search-input")
            if (event.code === "Space" && document.activeElement !== searchInput) {
                event.preventDefault();
                this.isPlaying ? this.handlePause() : this.handlePlay();
            }
        });

        document.addEventListener("songClicked", (event) => {
            const id = parseInt(event.detail) - 1; // Calculate once
            const song = this.songList.find(song => song.id === id + 1);

            if (song) {
                if (this.currentSongIndex !== id) {
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

        // Set the song ID as a data attribute on the audio element
        // Ensure it's a string for consistent comparison
        this.audio.setAttribute('data-song-id', song.id.toString());

        this.updateSongUI(song);

        this.loadSongCallCount === 0
            ? this.handlePause()
            : this.handlePlay()

        this.loadSongCallCount++;

        // Track the song play when loaded and played (except for the first time)
        if (this.loadSongCallCount > 1) {
            this.trackSongPlay(song.id);
        }

        // Dispatch a custom event to notify other components that the song has changed
        // Include the full song object for easier access to song properties
        document.dispatchEvent(new CustomEvent('song-changed', {
            detail: {
                id: song.id.toString(),
                title: song.title,
                artist: song.artist,
                albumCover: song.albumCover,
                songObject: song
            }
        }));
    }

    updateSongUI(song) {
        const songTitleElement = document.querySelector(".player-songname");
        const songArtistElement = document.querySelector(".player-artistname");
        const songAlbumElement = document.querySelector(".player-songcover img");
        const durationElement = document.querySelector(".player-duration");

        if (songTitleElement) {
            songTitleElement.textContent = song.title; // Update the song title
        }

        if (songArtistElement) {
            songArtistElement.textContent = song.artist.length > 1
                ? song.artist.map(name => name.split(' ')[0]).join(', ').substring(0, 22) + '...'
                : song.artist[0];
        }

        if (songAlbumElement) {
            songAlbumElement.src = song.albumCover;
        }

        // Update duration after audio metadata is loaded
        this.audio.addEventListener('loadedmetadata', () => {
            if (durationElement) {
                const minutes = Math.floor(this.audio.duration / 60);
                const seconds = Math.floor(this.audio.duration % 60);
                durationElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

                // Also update the song data with actual duration
                song.duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
        }, {once: true});
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

        // Update width using percentage for better alignment
        const width = progress < 40 ? `${progress + 1}%` : `${progress}%`;

        this.seekBar.value = parseFloat(progress.toFixed(2));
        this.seekBar.style.setProperty("--width-m", width);
        this.seekBar.style.setProperty("--color", "var(--white)");

        // Update the current time display
        const currentTimeElement = document.querySelector(".player-current-time");
        if (currentTimeElement) {
            const minutes = Math.floor(this.audio.currentTime / 60);
            const seconds = Math.floor(this.audio.currentTime % 60);
            currentTimeElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        this.seekBar.dispatchEvent(new CustomEvent("updatedSeekbar", {
            detail: this.seekBar.value
        }));

        this.saveState();
    }

    seekAudio() {
        if (!isNaN(this.audio.duration)) {
            this.audio.currentTime = (parseFloat(this.seekBar.value) / 100) * this.audio.duration;
        }
    }

    handlePlay() {
        this.isPlaying = true;
        this.togglePlayPause(this.isPlaying);

        // Attempt to play the song
        try {
            if (this.audio.paused) {
                this.audio.play().then(() => {
                    // Track song play when resumed after being paused
                    // Only track if the song has already started playing (more than 1 second)
                    // and is not near the end (more than 5 seconds from the end)
                    const songId = this.audio.getAttribute('data-song-id');
                    if (songId && this.audio.currentTime > 1 && 
                        (!this.audio.duration || this.audio.currentTime < this.audio.duration - 5)) {
                        this.trackSongPlay(songId);
                    }
                }).catch(() => {
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
        
        // Save the current state including muted flag
        this.saveState();
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
        const currentSong = this.songList[this.currentSongIndex];
        const isCurrentSongFromAlbum = this.albumSongs.some(s => s.id === currentSong?.id);

        // If we're playing album songs and in album repeat mode
        if (isCurrentSongFromAlbum && this.albumSongs.length > 0) {
            const currentAlbumIndex = this.albumSongs.findIndex(s => s.id === currentSong.id);
            
            let nextAlbumIndex;
            
            if (this.isSingleRepeat) {
                // Repeat the same song
                nextAlbumIndex = currentAlbumIndex;
            } else if (this.isMultiRepeat) {
                // Go to next song, wrap around if at end
                nextAlbumIndex = (currentAlbumIndex + 1) % this.albumSongs.length;
            } else {
                // Go to next song, stop at end
                nextAlbumIndex = currentAlbumIndex + 1;
                
                // If we're at the end of album songs
                if (nextAlbumIndex >= this.albumSongs.length) {
                    // Stop or continue to non-album songs
                    if (!isNaN(this.audio.duration)) {
                        this.audio.currentTime = this.audio.duration;
                        this.handlePause();
                        return;
                    }
                }
            }
            
            if (nextAlbumIndex < this.albumSongs.length) {
                const nextSong = this.albumSongs[nextAlbumIndex];
                const nextSongIndex = this.songList.findIndex(s => s.id === nextSong.id);
                
                if (nextSongIndex !== -1) {
                    this.loadSong(nextSongIndex);
                } else {
                    this.loadAndPlaySong(nextSong);
                }
                
                this.handlePlay();
                return;
            }
        }
        
        // Fall back to default behavior for non-album songs
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

    handleShuffle(songs) {
        if (this.isShuffling) {
            console.warn("Shuffle is already in progress.");
            return; // Prevent re-entry if the shuffle is ongoing
        }

        this.isShuffling = true; // Lock the shuffle

        this.shuffleBtn.style.animation = "shuffleAnimation 750ms forwards ease-in-out";
        this.shuffleBtn.addEventListener("animationend", () => {
            this.shuffleBtn.style.animation = "";
        }, {once: true});


        setTimeout(() => {
            const currentSong = songs[this.currentSongIndex];
            const remainingSongs = songs.filter((_, index) => index !== this.currentSongIndex);

            this.songList = [currentSong, ...shuffle(remainingSongs)];

            this.currentSongIndex = 0;

            this.isShuffling = false; // Unlock after the shuffle is complete
        }, 750); // Simulate shuffle time (matches animation duration)
    }

    handleRepeat() {
        this.repeatStates.forEach((state) => this[state] = false);
        this.stateIndex = (this.stateIndex + 1) % 3;
        this[this.repeatStates[this.stateIndex]] = true;

        this.updateRepeatIcon(); // Update the repeat icon based on the new state
    }

    updateRepeatIcon() {
        const p = this.controls.querySelector("i p");

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
        return JSON.parse(localStorage.getItem("songState"));
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
            isMultiRepeat: this.isMultiRepeat};

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
        if (this.albumControls) {
            this.albumPlayBtn.style.display = isPlaying ? "none" : "block";
            this.albumPauseBtn.style.display = isPlaying ? "block" : "none";
        }
    }

    // Add a utility method to load and play a specific song
    loadAndPlaySong(song) {
        // Find the song in the song list by ID
        const songIndex = this.songList.findIndex(s =>
            s.id.toString() === song.id.toString());

        if (songIndex !== -1) {
            console.log('Found song in playlist at index', songIndex);
            this.loadSong(songIndex);
            this.handlePlay();
            // Track play
            this.trackSongPlay(song.id);
            return true;
        } else {
            console.log('Song not in playlist, attempting to play directly', song.title);

            // For songs not in the original playlist, we can try loading it directly
            try {
                // Create a temporary song object with required properties
                const tempSong = {
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    albumCover: song.albumCover,
                    file: song.file
                };

                // Temporarily add it to our song list
                this.songList.push(tempSong);
                const newIndex = this.songList.length - 1;

                // Load and play
                this.loadSong(newIndex);
                this.handlePlay();
                // Track play
                this.trackSongPlay(song.id);

                // Set a flag that this is a temporary song
                return true;
            } catch (error) {
                console.error('Error directly loading song:', error);
                return false;
            }
        }
    }

    // Add method to track song plays in Firestore
    trackSongPlay(songId) {
        // Track song play in Firestore
        fetch('/api/songs/track-play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                songId: songId
            })
        }).catch(error => {
            console.error('Error tracking song play:', error);
        });
    }

    // New method to set current album songs
    setAlbumSongs(albumSongs, albumName) {
        this.albumSongs = [...albumSongs]; // Make a copy
        this.currentAlbum = albumName;
        console.log(`Album set to "${albumName}" with ${albumSongs.length} songs`);
    }

    // New method to handle album play button
    handleAlbumPlay() {
        if (this.albumSongs.length === 0) {
            console.warn("No album songs to play");
            return;
        }

        // If no song is playing or current song is not from this album, start with first album song
        const currentSong = this.songList[this.currentSongIndex];
        const isPlayingAlbumSong = currentSong && this.albumSongs.some(s => s.id === currentSong.id);
        
        if (!isPlayingAlbumSong) {
            const firstAlbumSong = this.albumSongs[0];
            const firstAlbumSongIndex = this.songList.findIndex(s => s.id === firstAlbumSong.id);
            
            if (firstAlbumSongIndex !== -1) {
                this.loadSong(firstAlbumSongIndex);
            } else {
                // If album song is not in playlist, load it directly
                this.loadAndPlaySong(firstAlbumSong);
            }
        }
        
        this.handlePlay();
    }

    // New method to shuffle only album songs
    handleAlbumShuffle() {
        if (this.isShuffling || this.albumSongs.length === 0) {
            console.warn("Shuffle not available");
            return;
        }

        this.isShuffling = true;

        this.albumShuffleBtn.style.animation = "shuffleAnimation 750ms forwards ease-in-out";
        this.albumShuffleBtn.addEventListener("animationend", () => {
            this.albumShuffleBtn.style.animation = "";
        }, {once: true});

        setTimeout(() => {
            // Get current song if it's from this album
            const currentSong = this.songList[this.currentSongIndex];
            const isCurrentSongFromAlbum = this.albumSongs.some(s => s.id === currentSong?.id);
            
            // Shuffle album songs
            const shuffledAlbumSongs = shuffle([...this.albumSongs]);
            
            // If current song is from album, put it first
            if (isCurrentSongFromAlbum) {
                const currentSongIndex = shuffledAlbumSongs.findIndex(s => s.id === currentSong.id);
                if (currentSongIndex !== -1) {
                    const songToMove = shuffledAlbumSongs.splice(currentSongIndex, 1)[0];
                    shuffledAlbumSongs.unshift(songToMove);
                }
            }
            
            // Update album songs with shuffled version
            this.albumSongs = shuffledAlbumSongs;
            
            // Now play the first album song
            const firstAlbumSong = this.albumSongs[0];
            this.loadAndPlaySong(firstAlbumSong);
            
            this.isShuffling = false;
        }, 750);
    }

    // New method to handle album repeat button
    handleAlbumRepeat() {
        this.repeatStates.forEach((state) => this[state] = false);
        this.stateIndex = (this.stateIndex + 1) % 3;
        this[this.repeatStates[this.stateIndex]] = true;

        this.updateAlbumRepeatIcon();
    }

    // Update album repeat icon
    updateAlbumRepeatIcon() {
        if (!this.albumControls) return;
        
        const p = this.albumControls.querySelector("i p");
        if (!p) return;

        // Clear previous animation
        this.albumRepeatBtn.style.animation = "";

        if (this.isSingleRepeat) {
            p.textContent = "1";
            p.style.display = "block";
        } else if (this.isMultiRepeat) {
            p.textContent = "";
            p.style.display = "block";
            this.albumRepeatBtn.style.animation = "rotateClockwise 500ms linear forwards";
        } else {
            p.style.display = "none";
        }
    }
}

export { MusicControl };

// Global instance
window.MusicControl = MusicControl;
