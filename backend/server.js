const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const dbconnect = require("./dbconnect/dbcon.js");
const { songsDB1, fetchJSON } = require('./model/dataModel.js');
const userData = require("./model/userModel.js");
const songData = require("../frontend/public/data/songsData.json");
const { shuffle } = require('../frontend/public/scripts/utility/shuffle');

dbconnect()
try {
    // songsDB1();
} catch (err) {
    console.warn("Error saving data: " + err);
}
fetchJSON()

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

    app.use(async (req, res, next) => {
        // Placeholder song data
        const song = {
            "id": 1,
            "title": "Do Pal",
            "artist": [
                "Lata Mangeshkar",
                "Sonu Nigam",
                "Madan Mohan",
                "Javed Akhtar"
            ],
            "album": "Veer-Zaara",
            "genre": "Bollywood",
            "file": "/uploads/do-pal.mp3",
            "albumCover": "assets/album-covers/veer-zaara.webp"
        }

        // Filter unique albums
        const albums = [...new Set(songData.map(song => song.album))];
        const albumData = songData.filter(song => albums.includes(song.album));

        res.locals.usernameLetter = 'S';
        res.locals.song = song;
        res.locals.songRow1 = shuffle([...songData]);
        res.locals.songRow2 = shuffle([...songData]);
        res.locals.albums = shuffle(albumData);

        next();
    });

    app.use(express.static(paths.public));
    app.use(express.json());
};

// Define static page routes
const setupPageRoutes = () => {
    const pages = {
        "/": "SignUpPage",
        "/home": "HomePage",
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

    app.post("/api/register", async (req, res) => {
        const { firstName, lastName, email, password } = req.body;
        try {
            const newUser = new userData({ firstName, lastName, email, password });
            await newUser.save();
            res.status(201).json({ message: "User  registered successfully." });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ error: "Email already exists." });
            }
            res.status(500).json({ error: "Internal server error." });
        }
    });

    app.post("/api/login", async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await userData.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: "Email not associated with any account." });
            }

            if (user.password !== password) {
                return res.status(401).json({ error: "Invalid credentials. Please try again." });
            }

            res.status(200).json({ message: "Login successful!", user });
        } catch (error) {
            console.error("Error during login:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    });

    app.post("/api/forgot-password", async (req, res) => {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required." });
        }

        try {
            const user = await userData.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: "Email not associated with any account." });
            }
            res.status(200).json({ password: user.password });
        } catch (error) {
            console.error("Error during password retrieval:", error);
            res.status(500).json({ error: "Internal server error." });
        }
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
