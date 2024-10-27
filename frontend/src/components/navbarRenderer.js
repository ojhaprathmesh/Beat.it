function extendNavbar() {
    return `
    <div class="logo-container">
        <a id="logo" href="HomePage.html">
            <img src="../assets/Beat.it White Logo.webp" alt="Beat.it Logo" width="60px" height="60px">
        </a>
    </div>

    <form class="searchbar" action="SearchPage.html">
        <img id="search-icon" src="../assets/home/Search.webp" alt="Search Icon" width="32px" height="32px">
        <hr id="line-separator">
        <input class="font-inter" id="search-input" type="text" placeholder="Search by artists, songs or albums"
            style="font-weight: 100;">
    </form>

    <div class="profile font-inter">
        <label for="toggle-overlay">
            <h1 id="username-letter" style="font-weight: 100;">S</h1>
        </label>

        <input type="checkbox" id="toggle-overlay" style="display: none;">

        <div class="overlay">
            <a href="ProfilePage.html">Profile</a>
            <div>
                <hr style="width: 90%; border: 1px solid #3E3E3E">
            </div>
            <a href="LoginPage.html">Log Out</a>
        </div>
    </div>
    `;
}

function insertNavbar(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
        container.innerHTML += extendNavbar();
    }
}

export { insertNavbar };
