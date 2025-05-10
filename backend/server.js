const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require("express-session");
const dotenv = require('dotenv');

dotenv.config();

// Firebase Services (replacing MongoDB imports)
// Comment out MongoDB imports but keep them for reference during transition
// const dbConnect = require("./dbconnect/dbcon.js");
// const {createDB, fetchJSON} = require('./model/dataModel.js');
// const userData = require("./model/userModel.js");

// Firebase imports
const { auth, db } = require('./firebase/firebaseConfig');
const { createUser, loginUser, forgotPassword, resetPassword } = require('./firebase/authService');
const { getAllSongs, exportSongsToJSON } = require('./firebase/songsService');
const { migrateFromMongoDB } = require('./firebase/migrationUtil');

// Utilities
let songData = [];
fs.readFile(path.join(__dirname, '../frontend/public/data/songsData.json'), 'utf8', (err, data) => {
  if (!err) {
    try {
      songData = JSON.parse(data);
      console.log(`Loaded ${songData.length} songs from songsData.json`);
    } catch (parseError) {
      console.error('Error parsing songsData.json:', parseError);
    }
  } else {
    console.warn('Could not load songsData.json, using empty array:', err);
  }
});

const {shuffle} = require('../frontend/public/scripts/utility/shuffle');

// Function to load songs from local files without overwriting
function loadLocalSongs() {
  const dataFilePath = path.join(__dirname, '../frontend/public/data/songsData.json');
  
  try {
    // Check if songsData.json exists and has content
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      try {
        const songData = JSON.parse(fileContent);
        if (songData && Array.isArray(songData) && songData.length > 0) {
          console.log(`Loaded ${songData.length} songs from existing songsData.json`);
          return songData;
        }
      } catch (parseError) {
        console.error('Error parsing songsData.json:', parseError);
      }
    }
    
    // If we couldn't load data from the file, return empty array
    console.warn('Could not load data from songsData.json');
    return [];
  } catch (error) {
    console.error('Error loading songs:', error);
    return [];
  }
}

const app = express();
const port = 3000;

// Initialize Database - Using Firebase instead of MongoDB
// Comment out MongoDB initialization but keep for reference
/*
dbConnect().then(() => {
    console.log("Connected to the database successfully!");

    createDB().then(() => {
        console.log("Database created and data inserted.");

        // After the database is created, call fetchJSON() and log the file path
        fetchJSON().then((filePath) => {
            console.log(`Data successfully saved to ${filePath}`);
        }).catch((error) => {
            console.error("Error saving data to file:", error);
        });
    }).catch((error) => {
        console.error("Error during database creation or data insertion:", error.message);
    });
});
*/

// Check if migration is needed - set this based on environment variable or first run
const shouldMigrate = process.env.SHOULD_MIGRATE === 'true';

if (shouldMigrate) {
  console.log('Migration flag set, will migrate data from MongoDB to Firebase');
  migrateFromMongoDB()
    .then(() => {
      console.log('Migration completed successfully');
      // Update songData after migration
      fs.readFile(path.join(__dirname, '../frontend/public/data/songsData.json'), 'utf8', (err, data) => {
        if (!err) {
          songData = JSON.parse(data);
        } else {
          console.error('Error reading updated songsData.json after migration:', err);
        }
      });
    })
    .catch(error => {
      console.error('Migration failed:', error);
    });
} else {
  // Load songs from file if they weren't loaded earlier
  if (songData.length === 0) {
    try {
      songData = loadLocalSongs();
    } catch (error) {
      console.error('Error loading songs data:', error);
    }
  }
}

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
    cookie: {secure: false}
}));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", paths.views);

// Set song data in response locals for rendering
app.use((req, res, next) => {
    // Load albums data from albumsData.json for correct album names
    try {
        const albumsDataPath = path.join(paths.data, 'albumsData.json');
        const albumsData = fs.existsSync(albumsDataPath) ? 
            JSON.parse(fs.readFileSync(albumsDataPath, 'utf8')) : [];
        
        // Transform albumsData to have the same structure as songs for compatibility
        const formattedAlbums = albumsData.map(album => ({
            album: album.albumName,
            albumCover: `/assets/album-covers${album.albumCover}`,
            id: album.songs?.[0]?.id || 0
        }));
        
        res.locals.song = songData.length > 0 ? songData[0] : {}; // Placeholder song data
        res.locals.songRow1 = shuffle([...songData]);
        res.locals.songRow2 = shuffle([...songData]);
        res.locals.albums = shuffle(formattedAlbums);
    } catch (error) {
        console.error('Error loading albums data:', error);
        // Fallback to the old method if there's an error
        const albums = [...new Set(songData.map(song => song.album))];
        const albumData = songData.filter(song => albums.includes(song.album));
        
        res.locals.song = songData.length > 0 ? songData[0] : {}; // Placeholder song data
        res.locals.songRow1 = shuffle([...songData]);
        res.locals.songRow2 = shuffle([...songData]);
        res.locals.albums = shuffle(albumData);
    }

    next();
});

// Static Routes for EJS Views
const pageRoutes = {
    "/": "SignupPage",
    "/home": "HomePage",
    "/signup": "SignupPage",
    "/login": "LoginPage",
    "/profile": "ProfilePage",
    "/search": "SearchPage",
    "/album": "AlbumPage",
    "/reset-password": "ResetPasswordPage",
};

Object.entries(pageRoutes).forEach(([route, view]) => {
    app.get(route, (req, res) => {
        const {usernameLetter, name, email} = req.session;

        // Redirect to login if not authenticated
        if (!usernameLetter && !['/login', '/signup'].includes(route)) {
            return res.redirect("/login");
        }

        // If route is "/profile", pass user details
        if (route === "/profile") {
            return res.render(view, {username: name, usermail: email});
        }

        res.render(view, {usernameLetter});
    });
});

// API Routes
app.get("/api/data/:type", (req, res) => {
    const {type} = req.params;
    const allowedFiles = ["profileData", "songsData", "albumsData"];

    if (!allowedFiles.includes(type)) return res.status(404).json({error: "Invalid data request."});

    // For song data, return the in-memory data if available
    if (type === "songsData" && songData.length > 0) {
        return res.json(songData);
    }

    // Otherwise read from file
    fs.readFile(path.join(paths.data, `${type}.json`), "utf-8", (err, data) => {
        if (err) {
            console.error(`Error reading ${type}.json:`, err);
            return res.status(500).json({error: "Error reading the file."});
        }
        res.json(JSON.parse(data));
    });
});

// Updated to use Firebase Authentication
app.post("/api/register", async (req, res) => {
    const {firstName, lastName, email, password} = req.body;
    try {
        await createUser({firstName, lastName, email, password});
        res.status(201).json({message: "User registered successfully."});
    } catch (error) {
        res.status(error.code === 11000 ? 400 : 500).json({
            error: error.code === 11000 ? "Email already exists." : "Internal server error."
        });
    }
});

// Updated to use Firebase Authentication
app.post("/api/login", async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await loginUser(email, password);
        
        // Set session data
        req.session.usernameLetter = email.charAt(0).toUpperCase();
        req.session.email = email;
        req.session.name = `${user.firstName} ${user.lastName}`;
        
        res.status(200).json({message: "Login successful!"});
    } catch (error) {
        const isInvalidCredentials = error.message === 'Invalid credentials.';
        const isUserNotFound = error.message === 'User profile not found';
        
        res.status(isInvalidCredentials || isUserNotFound ? 401 : 500).json({
            message: isInvalidCredentials ? "Invalid credentials." : 
                     isUserNotFound ? "Email not associated with any account." : "Internal server error."
        });
    }
});

// Updated to use Firebase Authentication
app.post("/api/forgot-password", async (req, res) => {
    const {email} = req.body;
    if (!email) return res.status(400).json({error: "Email is required."});

    try {
        await forgotPassword(email);
        res.status(200).json({message: "Password reset email sent."});
    } catch (error) {
        const isUserNotFound = error.message === 'Email not associated with any account.';
        res.status(isUserNotFound ? 404 : 500).json({
            error: isUserNotFound ? "Email not associated with any account." : "Internal server error."
        });
    }
});

// New endpoint for resetting password with token
app.post("/api/reset-password", async (req, res) => {
    const {token, password} = req.body;
    
    if (!token || !password) {
        return res.status(400).json({error: "Token and password are required."});
    }

    try {
        await resetPassword(token, password);
        res.status(200).json({message: "Password reset successful."});
    } catch (error) {
        const isInvalidToken = error.message === 'Invalid or expired token.';
        res.status(isInvalidToken ? 400 : 500).json({
            error: isInvalidToken ? "Invalid or expired token. Please request a new password reset." : "Internal server error."
        });
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
