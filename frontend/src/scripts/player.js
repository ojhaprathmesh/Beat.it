// Like button funtionality
const likeBtn = document.querySelector('.like-btn');
const checkbox = document.getElementById('like-check');

likeBtn.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked; // Toggle the checkbox
    if (checkbox.checked) {
        likeBtn.style.color = 'red';
    } else {
        likeBtn.style.color = '#FEFFF1';
    }
});

// Music play/pause functionality
const progress = document.querySelector(".progress")

const songControl = document.querySelector(".controls");

const playBtn = songControl.querySelector(".play");
const pauseBtn = songControl.querySelector(".pause");
const reverseBtn = songControl.querySelector(".reverse");
const forwardBtn = songControl.querySelector(".forward");
const shuffleBtn = songControl.querySelector(".shuffle");
const repeatBtn = songControl.querySelector(".repeat");

let isPlaying = true;

// Play button functionality
playBtn.addEventListener('click', () => {
    if (!isPlaying) {
        playBtn.style.display = "none";
        pauseBtn.style.display = "block";
        progress.style.animationPlayState = "running";
    }
    isPlaying = true;
});

// Pause button functionality
pauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        playBtn.style.display = "block";
        pauseBtn.style.display = "none";
        progress.style.animationPlayState = "paused";
    }
    isPlaying = false;
});

// Reverse button functionality
reverseBtn.addEventListener('click', () => {
    progress.style.animation = 'none';
    progress.offsetHeight;

    progress.style.animation = 'musicProgress 30s linear forwards';
    progress.style.animationPlayState = 'running';

    playBtn.style.display = "none";
    pauseBtn.style.display = "block";

    isPlaying = true;
});

// Forward button functionality
forwardBtn.addEventListener('click', () => {
    progress.style.animationPlayState = 'paused';

    progress.style.animation = 'none';
    progress.offsetHeight;
    progress.style.animation = 'musicProgress 0s linear forwards';

    playBtn.style.display = "block";
    pauseBtn.style.display = "none";

    isPlaying = false;
});

// Shuffle button functionality
shuffleBtn.addEventListener('click', () => {
    shuffleBtn.style.color = "yellow";

    setTimeout(() => {
        shuffleBtn.style.color = "#FEFFF1";
    }, 500);
});

// Repeat button funcitonality
repeatBtn.addEventListener('click', () => {
    // Work in progress :)
})