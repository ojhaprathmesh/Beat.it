function extendFooter() {
    return `
    <div class="player-albuminfo">
        <div class="player-songcover">
            <img src="../assets/home/Album Cover.webp" alt="Player Album Cover" width="75px" height="75px">
        </div>

        <div class="player-songdetails font-inter" style="font-weight: 500;">
            <div class="player-songname">Main Yahaan Hoon</div>
            <div class="player-artistname">Artist</div>
        </div>

        <div class="like-btn">
            <input type="checkbox" id="like-check" style="display: none;">
            <i class="fas fa-heart" style="font-size: larger;"></i>
        </div>
    </div>

    <div class="playbar">
        <div class="progress-bar">
            <div class="progress"></div>
        </div>

        <div class="controls">
            <i class="fas fa-random shuffle"></i> <!-- Shuffle -->
            <i class="fas fa-step-backward reverse"></i> <!-- Reverse -->
            <i class="fas fa-play play" style="display: none; padding-right: 4px;"></i> <!-- Play -->
            <i class="fas fa-pause pause" style="display: block; padding: 0 7px;"></i> <!-- Pause -->
            <i class="fas fa-step-forward forward"></i> <!-- Forward -->
            <i class="fa-solid fa-repeat repeat"></i> <!-- Repeat -->
        </div>
    </div>

    <div class="other-controls">
        <div class="burger-menu"> <!-- More Options -->
            <i class="fas fa-ellipsis-v"></i>
            <i class="fas fa-bars"></i>
        </div>

        <div class="volume">
            <i class="fas fa-volume-mute" id="volume-mute" style="display: none;"></i> <!-- Mute -->
            <i class="fas fa-volume-down" id="volume-one" style="display: none;"></i> <!-- Low Volume -->
            <i class="fas fa-volume-up" id="volume-three" style="display: block;"></i> <!-- High Volume -->
            <div class="volume-control-bar"> <!-- Volume Progress Bar -->
                <div class="volume-progress"></div> <!-- Volume Progress -->
            </div>
        </div>
    </div>
    `;
}

function insertPlayer(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
        container.innerHTML += extendFooter();
    }
}

export { insertPlayer };
