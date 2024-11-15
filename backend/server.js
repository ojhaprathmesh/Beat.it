const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const publicPath = path.join(__dirname, "../frontend/public/");
const sourcePath = path.join(__dirname, "../frontend/src/");
const pagePath = path.join(__dirname, "../frontend/src/pages");
const dataPath = path.join(__dirname, "../database/data/");
const uploadsPath = path.join(__dirname, "../database/uploads/");
const albumCoversPath = path.join(__dirname, "../database/album-covers/");

app.use(express.static(publicPath));
app.use(express.static(sourcePath));
app.use(express.static(pagePath));
app.use(express.static(uploadsPath));
app.use(express.static(albumCoversPath));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: publicPath });
});

app.get("/signin", (req, res) => {
    res.sendFile("SignUpPage.html", { root: pagePath });
});

app.get("/login", (req, res) => {
    res.sendFile("LoginPage.html", { root: pagePath });
});

app.get("/home", (req, res) => {
    res.sendFile("HomePage.html", { root: pagePath });
});

app.get("/profile", (req, res) => {
    res.sendFile("ProfilePage.html", { root: pagePath });
});

// Secure API endpoints for database access
app.get("/api/data/:type", (req, res) => {
    const type = req.params.type;
    const allowedFiles = ["profileData", "songsData", "albumsData", "artistsData"]; // Only allow these files

    if (allowedFiles.includes(type)) {
        const filePath = path.join(dataPath, `${type}.json`);
        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error reading the file" });
            }
            res.json(JSON.parse(data));
        });
    } else {
        res.status(404).json({ error: "Invalid data request" });
    }
});

app.get("*", (req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Page Not Found</title>
        </head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/">Go back to homepage</a>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log("Connected!!!");
    console.log("Server hosting at http://localhost:3000");
});
