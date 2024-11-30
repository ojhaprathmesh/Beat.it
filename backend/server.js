const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "embjsFiles"));

let albumSongs = [];

// Paths (centralize the path definitions)
const paths = {
    public: path.join(__dirname, "../frontend/public/"),
    source: path.join(__dirname, "../frontend/src/"),
    pages: path.join(__dirname, "../frontend/src/pages"),
    data: path.join(__dirname, "../database/data/"),
    uploads: path.join(__dirname, "../database/uploads/"),
    albumCovers: path.join(__dirname, "../database/album-covers/")
};

// Middleware: Serve static files and handle JSON
const serveStaticFiles = () => {
    app.use((req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        next();
    });

    app.use(express.static(paths.public));
    app.use(express.static(paths.source));
    app.use(express.static(paths.uploads));
    app.use(express.static(paths.albumCovers));
    app.use(express.static(paths.pages));
    app.use(express.json());
};

// Define static page routes
const setupPageRoutes = () => {
    const pages = {
        "/": "index.html",
        "/signin": "SignupPage.html",
        "/login": "LoginPage.html",
        "/home": "HomePage.html",
        "/profile": "ProfilePage.html",
        "/search": "SearchPage.html",
        "/album": "AlbumPage.html"
    };

    Object.entries(pages).forEach(([route, file]) => {
        app.get(route, (req, res) => res.sendFile(file, { root: paths.pages }));
    });
};

// Add updateJSONFile helper function above setupAPIRoutes
const updateJSONFile = (filePath, newData) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(newData, null, 2), "utf-8", (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// API Routes
const setupAPIRoutes = () => {
    app.get("/api/data/:type", (req, res) => {
        const { type } = req.params;
        const allowedFiles = ["profileData", "songsData", "albumsData", "artistsData"];

        if (!allowedFiles.includes(type)) {
            return res.status(404).json({ error: "Invalid data request." });
        }

        const filePath = path.join(paths.data, `${type}.json`);
        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) return res.status(500).json({ error: "Error reading the file." });
            res.json(JSON.parse(data));
        });
    });

    // Add the new PUT route for updating durations
    app.put("/api/data/update-durations", async (req, res) => {
        const { songs } = req.body;

        if (!Array.isArray(songs)) {
            return res.status(400).json({ error: "Invalid data format. 'songs' must be an array." });
        }

        const filePath = path.join(paths.data, "songsData.json");

        try {
            await updateJSONFile(filePath, songs);
            res.json({ message: "Durations updated successfully." });
        } catch (error) {
            console.error("Error updating durations:", error);
            res.status(500).json({ error: "Failed to update song durations." });
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

// Setting up the server and starting it
const startServer = () => {
    serveStaticFiles();   // Serve static files
    setupPageRoutes();    // Setup static page routes
    setupAPIRoutes();     // Setup API routes
    handle404();          // Handle 404 for undefined routes
    app.listen(port, () => {
        console.log("Server hosting at http://localhost:" + port);
    });
};

startServer();
