const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

const publicPath = path.join(__dirname, "../frontend/public/");
const pagePath = path.join(__dirname, "../frontend/src/pages");

app.use(express.static(publicPath));
app.use(express.static(pagePath));
app.use(express.static(path.join(__dirname, "../database")));
app.use(express.static(path.join(__dirname, "../frontend/src/")));

app.listen(port, () => {
    console.log("Connected!!!");
    console.log("Server hosting at http://localhost:3000");
});

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
