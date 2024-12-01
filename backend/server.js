const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require("express-session");
const dbConnect = require("./dbconnect/dbcon.js");
const { createDB, fetchJSON } = require('./model/dataModel.js');
const userData = require("./model/userModel.js");
const songData = require("../frontend/public/data/songsData.json");
const { shuffle } = require('../frontend/public/scripts/utility/shuffle');

const app = express();
const port = 3000;

// Initialize Database Connection
dbConnect();
createDB();
fetchJSON();

// Paths Configuration
const paths = {
    public: path.join(__dirname, "../frontend/public"),
    views: path.join(__dirname, "../frontend/views"),
    data: path.join(__dirname, "../frontend/public/data"),
};

// Middleware Setup
app.use(express.static(paths.public));
app.use(express.json());
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", paths.views);

// Set song data in response locals for rendering
app.use((req, res, next) => {
    const albums = [...new Set(songData.map(song => song.album))];
    const albumData = songData.filter(song => albums.includes(song.album));

    res.locals.song = songData[0]; // Placeholder song data
    res.locals.songRow1 = shuffle([...songData]);
    res.locals.songRow2 = shuffle([...songData]);
    res.locals.albums = shuffle(albumData);

    next();
});

// Static Routes for EJS Views
const pageRoutes = {
    "/": "SignUpPage",
    "/home": "HomePage",
    "/signup": "SignUpPage",
    "/login": "LoginPage",
    "/profile": "ProfilePage",
    "/search": "SearchPage",
    "/album": "AlbumPage",
};

Object.entries(pageRoutes).forEach(([route, view]) => {
    app.get(route, (req, res) => {
        const { usernameLetter, name, email } = req.session;

        // Redirect to login if not authenticated
        if (!usernameLetter && route !== "/login") {
            return res.redirect("/login");
        }

        // If route is "/profile", pass user details
        if (route === "/profile") {
            return res.render(view, { username: name, usermail: email });
        }

        res.render(view, { usernameLetter });
    });
});

// API Routes
app.get("/api/data/:type", (req, res) => {
    const { type } = req.params;
    const allowedFiles = ["profileData", "songsData", "albumsData"];

    if (!allowedFiles.includes(type)) return res.status(404).json({ error: "Invalid data request." });

    fs.readFile(path.join(paths.data, `${type}.json`), "utf-8", (err, data) => {
        if (err) return res.status(500).json({ error: "Error reading the file." });
        res.json(JSON.parse(data));
    });
});

app.post("/api/register", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        await new userData({ firstName, lastName, email, password }).save();
        res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
        res.status(error.code === 11000 ? 400 : 500).json({ error: error.code === 11000 ? "Email already exists." : "Internal server error." });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userData.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(user ? 401 : 404).json({ message: user ? "Invalid credentials." : "Email not associated with any account." });
        }

        req.session.usernameLetter = email.charAt(0).toUpperCase();
        req.session.email = email;
        req.session.name = `${user.firstName} ${user.lastName}`;
        res.status(200).json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
});

app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    try {
        const user = await userData.findOne({ email });
        if (!user) return res.status(404).json({ error: "Email not associated with any account." });
        res.status(200).json({ password: user.password });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// 404 Error Handling
app.use((req, res) => {
    res.status(404).send(`<h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p><a href="/">Go back to homepage</a>`);
});

// Start the Server
app.listen(port, () => {
    console.log(`Server hosting at http://localhost:${port}`);
});
