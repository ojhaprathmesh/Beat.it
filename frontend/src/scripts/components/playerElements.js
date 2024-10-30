import { fetchSongData } from "../apis/fetchSongData.js";

function renderAlbumInfo(song) {
    return `
        <div class="player-albuminfo">
            <div class="player-songcover">
                <img src="../assets/home/Album Cover.webp" alt="Player Album Cover" width="75px" height="75px">
            </div>

            <div class="player-songdetails font-inter" style="font-weight: 500;">
                <div class="player-songname">${song.title}</div>
                <div class="player-artistname">${song.artist}</div>
            </div>

            <div class="like-btn">
                <input type="checkbox" id="like-check" style="display: none;">
                <i class="fas fa-heart" style="font-size: larger;"></i>
            </div>
        </div>
    `;
}

function renderPlayBar() {
    return `
        <div class="playbar">
            <div class="music-progress-bar">
                <div class="music-progress"></div>
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
    `;
}

function renderVolumeControls() {
    return `
        <div class="volume">
            <i class="fas fa-volume-mute" id="volume-mute" style="display: none;"></i> <!-- Mute -->
            <i class="fas fa-volume-down" id="volume-one" style="display: none;"></i> <!-- Low Volume -->
            <i class="fas fa-volume" id="volume-two" style="display: none; filter: invert(1)">
                <img src="../assets/home/volume.png" width="20px">
            </i> <!-- Med Volume -->
            <i class="fas fa-volume-up" id="volume-three" style="display: block;"></i> <!-- High Volume -->
            <div class="volume-control-bar">
                <div class="volume-progress"></div>
            </div>
        </div>
    `;
}

function renderOtherControls() {
    return `
        <div class="other-controls">
            <div class="burger-menu"> <!-- More Options -->
                <i class="fas fa-ellipsis-v"></i>
                <i class="fas fa-bars"></i>
            </div>
            ${renderVolumeControls()}
        </div>
    `;
}

function createPlayer(song) {
    return `
        ${renderAlbumInfo(song)}
        ${renderPlayBar()}
        ${renderOtherControls()}
    `;
}

async function insertPlayer(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
        try {
            const songData = await fetchSongData();
            const song = songData[0];
            container.innerHTML += createPlayer(song);
        } catch (error) {
            console.error("Error fetching song data:", error);
        }
    }
}

export { insertPlayer };