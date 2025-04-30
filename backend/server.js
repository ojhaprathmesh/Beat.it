const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require("express-session");
require('dotenv').config();

// Firebase Configuration
const firebaseConfig = require('./config/firebase-config');
const userModel = process.env.DISABLE_FIREBASE !== 'true' ? require('./model/userModel') : null;

// Utilities
let songData = [];
console.log('Loading songs data from:', path.join(__dirname, "../frontend/public/data/songsData.json"));
try {
    songData = require("../frontend/public/data/songsData.json");
    console.log('Successfully loaded songs:', songData.length, 'songs found');
} catch (error) {
    console.error('Error loading songs data:', error);
    songData = [];
}

const { shuffle } = require('../frontend/public/scripts/utility/shuffle');

const app = express();
const port = process.env.PORT || 3000;

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
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", paths.views);

// Set song data in response locals for rendering
app.use((req, res, next) => {
    console.log('Setting up song data for request');
    try {
        const albums = [...new Set(songData.map(song => song.album))];
        console.log('Found albums:', albums);
        const albumData = songData.filter(song => albums.includes(song.album));

        // Check if the first song's audio file exists
        const firstSong = songData[0];
        if (firstSong) {
            const audioPath = path.join(paths.public, firstSong.audioSrc);
            if (!fs.existsSync(audioPath)) {
                console.warn(`Audio file not found: ${firstSong.audioSrc}`);
                // Use a default song if the audio file is missing
                firstSong.audioSrc = '/uploads/default.mp3';
            }
        }

        res.locals.song = firstSong || null;
        res.locals.songRow1 = shuffle([...songData]);
        res.locals.songRow2 = shuffle([...songData]);
        res.locals.albums = shuffle(albumData);
        
        console.log('Song data set up successfully');
        console.log('First song:', res.locals.song);
    } catch (error) {
        console.error('Error setting up song data:', error);
        res.locals.song = songData[0];
        res.locals.songRow1 = songData;
        res.locals.songRow2 = songData;
        res.locals.albums = songData;
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
};

Object.entries(pageRoutes).forEach(([route, view]) => {
    app.get(route, (req, res) => {
        const {usernameLetter, name, email} = req.session;

        // If route is "/profile", pass user details
        if (route === "/profile") {
            return res.render(view, {username: name, usermail: email});
        }

        // During development, allow access to all routes without authentication
        res.render(view, {usernameLetter: usernameLetter || 'D'}); // 'D' for Development
    });
});

// API Routes
app.get("/api/data/:type", (req, res) => {
    const {type} = req.params;
    const allowedFiles = ["profileData", "songsData", "albumsData"];

    if (!allowedFiles.includes(type)) return res.status(404).json({error: "Invalid data request."});

    fs.readFile(path.join(paths.data, `${type}.json`), "utf-8", (err, data) => {
        if (err) return res.status(500).json({error: "Error reading the file."});
        res.json(JSON.parse(data));
    });
});

app.post("/api/register", async (req, res) => {
    const {firstName, lastName, email, password} = req.body;
    
    try {
        // Check if Firebase is disabled (development mode)
        if (!firebaseConfig.isEnabled) {
            console.log('Running in development mode - using local storage');
            
            // Store user data in session
            req.session.usernameLetter = email.charAt(0).toUpperCase();
            req.session.email = email;
            req.session.name = `${firstName} ${lastName}`;
            
            // In development, store user data in a local file
            const usersFilePath = path.join(paths.data, 'users.json');
            let users = [];
            
            try {
                if (fs.existsSync(usersFilePath)) {
                    users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
                }
                
                // Check if email already exists
                if (users.some(user => user.email === email)) {
                    return res.status(400).json({ error: "Email already exists." });
                }
                
                // Add new user
                users.push({
                    id: users.length + 1,
                    firstName,
                    lastName,
                    email,
                    password // Note: In production, this should be hashed
                });
                
                fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
                return res.status(201).json({ message: "User registered successfully." });
            } catch (error) {
                console.error('Error handling local user registration:', error);
                return res.status(500).json({ error: "Error saving user data." });
            }
        }
        
        // Firebase mode
        if (!firebaseConfig.admin) {
            throw new Error('Firebase Admin SDK not initialized');
        }

        // Create user in Firebase Authentication
        const userRecord = await firebaseConfig.admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`
        });

        // Store additional user data in Firestore
        await firebaseConfig.admin.firestore().collection('users').doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            createdAt: new Date()
        });

        res.status(201).json({message: "User registered successfully."});
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'auth/email-already-exists') {
            res.status(400).json({error: "Email already exists."});
        } else {
            res.status(500).json({
                error: "Internal server error",
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

app.post("/api/login", async (req, res) => {
    const {email, password} = req.body;
    
    try {
        // Check if Firebase is disabled (development mode)
        if (!firebaseConfig.isEnabled) {
            const usersFilePath = path.join(paths.data, 'users.json');
            
            if (!fs.existsSync(usersFilePath)) {
                return res.status(404).json({message: "No users found."});
            }
            
            const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
            const user = users.find(u => u.email === email && u.password === password);
            
            if (!user) {
                return res.status(401).json({message: "Invalid credentials."});
            }
            
            req.session.usernameLetter = email.charAt(0).toUpperCase();
            req.session.email = email;
            req.session.name = `${user.firstName} ${user.lastName}`;
            
            return res.status(200).json({message: "Login successful!"});
        }
        
        // Firebase mode
        const user = await firebaseConfig.signInWithEmail(email, password);
        const userData = await userModel.findUserByEmail(email);

        if (!userData) {
            return res.status(404).json({message: "User data not found."});
        }

        req.session.usernameLetter = email.charAt(0).toUpperCase();
        req.session.email = email;
        req.session.name = `${userData.firstName} ${userData.lastName}`;
        res.status(200).json({message: "Login successful!"});
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = {
            'auth/user-not-found': "Email not associated with any account.",
            'auth/wrong-password': "Invalid password.",
            'auth/invalid-email': "Invalid email format.",
            'auth/too-many-requests': "Too many failed login attempts. Please try again later."
        }[error.code] || "Internal server error.";
        
        res.status(error.code?.includes('auth/') ? 400 : 500).json({message: errorMessage});
    }
});

app.post("/api/forgot-password", async (req, res) => {
    const {email} = req.body;
    if (!email) return res.status(400).json({error: "Email is required."});

    try {
        await firebaseConfig.auth.sendPasswordResetEmail(email);
        res.status(200).json({message: "Password reset email sent successfully."});
    } catch (error) {
        res.status(error.code === 'auth/user-not-found' ? 404 : 500)
           .json({error: error.code === 'auth/user-not-found' ? "Email not associated with any account." : "Internal server error."});
    }
});

// Add this after the other API routes
app.get("/api/songs", (req, res) => {
    console.log('Songs data requested');
    console.log('Current songs:', JSON.stringify(songData, null, 2));
    res.json(songData);
});

// 404 Error Handling
app.use((req, res) => {
    res.status(404).send(`<h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p><a href="/">Go back to homepage</a>`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the Server
app.listen(port, () => {
    console.log(`Server hosting at http://localhost:${port}`);
});
