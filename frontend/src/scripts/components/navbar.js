function renderLogo() {
    return `
        <div id="logo">
            <img src="../assets/Beat.it White Logo.webp" alt="Beat.it Logo" width="60px" height="60px">
        </div>
    `;
}

function renderSearchBar() {
    return `
        <form class="searchbar" action="/search">
            <img id="search-icon" src="../assets/home/Search.webp" alt="Search Icon" width="32px" height="32px">
            <hr id="line-separator">
            <input class="font-inter" id="search-input" type="text" placeholder="Search by artists, songs or albums" style="font-weight: 100;">
        </form>
    `;
}

function renderMenu() {
    return `
        <div class="menu font-inter">
            <h1 id="username-letter" style="font-weight: 100;">S</h1>
            <div class="overlay">
                <p id="profile">Profile</p>
                <div>
                    <hr style="width: 90%; border: 1px solid #3E3E3E">
                </div>
                <p id="logout">Log Out</p>
            </div>
        </div>
    `;
}

function createNavbar() {
    return `
        ${renderLogo()}
        ${renderSearchBar()}
        ${renderMenu()}
    `;
}

function insertNavbar(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
        container.innerHTML += createNavbar();
    }
}

export { insertNavbar };