const express = require('express');
const path = require('path');
const fs = require('fs');
const {shuffle} = require('../frontend/public/scripts/utility/shuffle');
const {fetchSongData} = require("../frontend/public/scripts/utility/fetchSongData");

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

        res.render('HomePage', {
            usernameLetter: 'S',
            songRow1: shuffle(songData),
            songRow2: shuffle(songData),
        });
    });
};

// Helper: Update JSON file
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
        const {type} = req.params;
        const allowedFiles = ["profileData", "songsData", "albumsData"];

        if (!allowedFiles.includes(type)) {
            return res.status(404).json({error: "Invalid data request."});
        }

        const filePath = path.join(paths.data, `${type}.json`);
        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) return res.status(500).json({error: "Error reading the file."});
            res.json(JSON.parse(data));
        });
    });

    // // PUT route to update song durations
    // app.put("/api/data/update-durations", async (req, res) => {
    //     const {songs} = req.body;
    //
    //     if (!Array.isArray(songs)) {
    //         return res.status(400).json({error: "Invalid data format. 'songs' must be an array."});
    //     }
    //
    //     const filePath = path.join(paths.data, "songsData.json");
    //
    //     try {
    //         await updateJSONFile(filePath, songs);
    //         res.json({message: "Durations updated successfully."});
    //     } catch (error) {
    //         console.error("Error updating durations:", error);
    //         res.status(500).json({error: "Failed to update song durations."});
    //     }
    // });
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
