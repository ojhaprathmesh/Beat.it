import { fetchSongData } from "../utility/fetchSongData.js";

function renderAlbumInfo(song) {
    return `
        <div class="player-albuminfo">
            <div class="player-songcover">
                <img src="${song.albumCover}" alt="${song.albumCover}" width="75px" height="75px" style="border-radius: 10px">
            </div>

            <div class="player-songdetails font-inter" style="font-weight: 500;">
                <div class="player-songname">${song.title}</div>
                <div class="player-artistname">${song.artist}</div>
            </div>

            <div class="like-btn">
                <i class="fas fa-heart" style="font-size: larger;">
                    <input type="checkbox" class="like-check" />
                </i>
            </div>
        </div>
    `;
}

function renderPlayBar() {
    return `
        <div class="playbar">
            <audio id="songPlayer"><source type="audio/mpeg"></audio>
            <div class="music-progress-bar">
                <label for="seekMusic" id="seekMusicLabel" class="seekbar-label">.</label>
                <input type="range" id="seekMusic" class="seekbar" min="0" max="100" value="0" step="0.01">
            </div>

            <div class="controls">
                <i class="fas fa-random shuffle"></i> <!-- Shuffle -->
                <i class="fas fa-step-backward reverse"></i> <!-- Reverse -->
                <i class="fas fa-play play" style="display: none; padding-right: 4px;"></i> <!-- Play -->
                <i class="fas fa-pause pause" style="display: block; padding: 0 7px;"></i> <!-- Pause -->
                <i class="fas fa-step-forward forward"></i> <!-- Forward -->
                <i class="fa-solid fa-repeat repeat">
                    <p style="
                        display: none;
                        color: var(--white);
                        position: absolute;
                        left: 811px;
                        bottom: 24px;
                        font-size: 12px;
                        font-weight: bold;
                        font-family: 'Segoe UI';
                        cursor: pointer;
                    ">1
                    </p>
                </i> <!-- Repeat -->
            </div>
        </div>
    `;
}

function renderVolumeControls() {
    return `
        <div class="volume">
            <i class="fas fa-volume-mute" id="volume-mute" style="display: none;"></i>
            
            <i class="fas fa-volume-down" id="volume-one" style="display: none;"></i>
            
            <i class="fas fa-volume" id="volume-two" style="display: none; filter: invert(1)">
                <img src="../assets/home/volume.png" alt="" width="20px">
            </i>
            
            <i class="fas fa-volume-up" id="volume-three" style="display: block;"></i>
            
            <div class="volume-control-bar">
                <label for="seekVolume" id="seekVolumeLabel" class="seekbar-label">.</label>
                <input type="range" id="seekVolume" min="0" max="100" value="50" step="1">
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
            console.warn("Error fetching song data:", error);
        }
    }
}

export { insertPlayer };