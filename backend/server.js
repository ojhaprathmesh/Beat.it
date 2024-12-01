const express = require('express');
const path = require('path');
const fs = require('fs');
const { shuffle } = require('../frontend/public/scripts/utility/shuffle');
const { fetchSongData } = require("../frontend/public/scripts/utility/fetchSongData");

const app = express();
const port = 3000;

// Paths
const paths = {
    public: path.join(__dirname, "../frontend/public"),
    views: path.join(__dirname, "../frontend/views"),
    data: path.join(__dirname, "../frontend/public/data"),
};

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", paths.views);  // Directory to look for EJS views

// Middleware: Serve static files and handle JSON
const serveStaticFiles = () => {
    app.use((req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        next();
    });

    app.use(express.static(paths.public));
    app.use(express.json());
};

// Define static page routes
const setupPageRoutes = () => {
    const pages = {
        "/": "SignUpPage",
        "/signup": "SignUpPage",
        "/login": "LoginPage",
        "/profile": "ProfilePage",
        "/search": "SearchPage",
        "/album": "AlbumPage",
    };

    // Routes for EJS views
    Object.entries(pages).forEach(([route, view]) => {
        app.get(route, (req, res) => res.render(view));  // Using .render() to render EJS templates
    });

    app.get('/home', async (req, res) => {
        const songData = await fetchSongData();

        // Shuffle the songs for both rows
        const [songRow1, songRow2] = [shuffle(songData), shuffle([...songData])];

        // Filter unique albums
        const albums = [...new Set(songData.map(song => song.album))];
        const albumData = songData.filter(song => albums.includes(song.album));

        res.render('HomePage', {
            usernameLetter: 'S',
            songRow1,
            songRow2,
            albums: shuffle(albumData),
            song: songData[0],
        });
    });
};

// API Routes
const setupAPIRoutes = () => {
    app.get("/api/data/:type", (req, res) => {
        const { type } = req.params;
        const allowedFiles = ["profileData", "songsData", "albumsData"];

        if (!allowedFiles.includes(type)) {
            return res.status(404).json({ error: "Invalid data request." });
        }

        const filePath = path.join(paths.data, `${type}.json`);
        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) return res.status(500).json({ error: "Error reading the file." });
            res.json(JSON.parse(data));
        });
    });
};

// 404 Error Handling
const handle404 = () => {
    app.use((req, res) => {
        res.status(404).send(`
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/">Go back to homepage</a>
        `);
    });
};

// Initialize and Start Server
const startServer = () => {
    serveStaticFiles();   // Serve static files
    setupPageRoutes();    // Setup static page routes
    setupAPIRoutes();     // Setup API routes
    handle404();          // Handle 404 for undefined routes

    app.listen(port, () => {
        console.log(`Server hosting at http://localhost:${port}`);
    });
};

startServer();
