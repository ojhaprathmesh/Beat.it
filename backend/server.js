const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Paths (centralize the path definitions)
const paths = {
    public: path.join(__dirname, "../frontend/public/"),
    source: path.join(__dirname, "../frontend/src/"),
    pages: path.join(__dirname, "../frontend/src/pages"),
    data: path.join(__dirname, "../database/data/"),
    uploads: path.join(__dirname, "../database/uploads/"),
    albumCovers: path.join(__dirname, "../database/album-covers/")
};

// Middleware: Serving static files
const serveStaticFiles = () => {
    app.use(express.static(paths.public));
    app.use(express.static(paths.source));
    app.use(express.static(paths.uploads));
    app.use(express.static(paths.albumCovers));
    app.use(express.static(paths.pages));
};

// Routes setup
const setupRoutes = () => {
    const pages = {
        "/": "index.html",
        "/signin": "SignupPage.html",
        "/login": "LoginPage.html",
        "/home": "HomePage.html",
        "/profile": "ProfilePage.html",
        "/search" : "SearchPage.html"
    };

    // Serve static pages
    Object.entries(pages).forEach(([route, file]) => {
        app.get(route, (req, res) => res.sendFile(file, { root: paths.pages }));
    });

    // API Routes
    app.get("/api/data/:type", (req, res) => {
        const { type } = req.params;
        const allowedFiles = ["profileData", "songsData", "albumsData", "artistsData"];
        if (allowedFiles.includes(type)) {
            fs.readFile(path.join(paths.data, `${type}.json`), "utf-8", (err, data) => {
                if (err) return res.status(500).json({ error: "Error reading the file" });
                res.json(JSON.parse(data));
            });
        } else {
            res.status(404).json({ error: "Invalid data request" });
        }
    });
};

// 404 Error handling
const handle404 = () => {
    app.use((req, res) => {
        res.status(404).send(`
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/">Go back to homepage</a>`);
    });
};

// Setting up the server and starting it
const startServer = () => {
    serveStaticFiles();
    setupRoutes();
    handle404();
    app.listen(port, () => {
        console.log("Server hosting at http://localhost:" + port);
    });
};

startServer();
