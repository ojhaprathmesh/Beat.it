import { insertPlayer } from '../components/player.js';

document.addEventListener('DOMContentLoaded', () => {
    insertPlayer('.player');

    // Like button functionality
    const likeBtn = document.querySelector('.like-btn');
    const checkbox = document.getElementById('like-check');

    likeBtn.addEventListener('click', () => {
        checkbox.checked = !checkbox.checked; // Toggle the checkbox
        likeBtn.classList.toggle('liked', checkbox.checked);
    });

    // Music play/pause functionality
    const progress = document.querySelector(".progress");
    const songControl = document.querySelector(".controls");

    const playBtn = songControl.querySelector(".play");
    const pauseBtn = songControl.querySelector(".pause");
    const reverseBtn = songControl.querySelector(".reverse");
    const forwardBtn = songControl.querySelector(".forward");
    const shuffleBtn = songControl.querySelector(".shuffle");
    const repeatBtn = songControl.querySelector(".repeat");

    let isPlaying = true;

    // Utility function to toggle play/pause buttons
    function togglePlayPause(isPlaying) {
        playBtn.style.display = isPlaying ? "none" : "block";
        pauseBtn.style.display = isPlaying ? "block" : "none";
        progress.style.animationPlayState = isPlaying ? "running" : "paused";
    }

    // Play button functionality
    playBtn.addEventListener('click', () => {
        if (!isPlaying) {
            togglePlayPause(true);
            isPlaying = true;
        }
    });

    // Pause button functionality
    pauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            togglePlayPause(false);
            isPlaying = false;
        }
    });

    // Reverse button functionality
    reverseBtn.addEventListener('click', () => {
        // Reset animation and start again
        progress.style.animation = 'none';
        progress.offsetHeight; // Trigger reflow to restart animation
        progress.style.animation = 'musicProgress 30s linear forwards';
        togglePlayPause(true);
        isPlaying = true;
    });

    // Forward button functionality
    forwardBtn.addEventListener('click', () => {
        // Stop animation and reset progress instantly
        progress.style.animation = 'none';
        progress.offsetHeight;
        progress.style.animation = 'musicProgress 0s linear forwards';
        togglePlayPause(false);
        isPlaying = false;
    });

    // Shuffle button functionality
    shuffleBtn.addEventListener('click', () => {
        shuffleBtn.style.animation = 'shuffleAnimation 0.5s forwards';

        shuffleBtn.addEventListener('animationend', () => {
            shuffleBtn.style.animation = '';
        }, { once: true }); // Ensure this listener runs only once
    });


    // Repeat button functionality (Work in progress)
    repeatBtn.addEventListener('click', () => {
        console.log("Repeat functionality not yet implemented.");
    });
});

