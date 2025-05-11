const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require("express-session");
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

// Firebase imports
const { auth, db } = require('./firebase/firebaseConfig');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, limit } = require('firebase/firestore');
const { createUser, loginUser, forgotPassword, resetPassword } = require('./firebase/authService');
const { getAllSongs, exportSongsToJSON } = require('./firebase/songsService');

// Import Cloudinary image service
const { uploadProfilePicture, getProfilePictureURL } = require('./cloudinary/imageService');

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

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Initialize Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle refresh-favorites event
  socket.on('refresh-favorites', (songId) => {
    // Broadcast to all clients except sender
    socket.broadcast.emit('refresh-favorites', songId);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Load songs from file if they weren't loaded earlier
if (songData.length === 0) {
  try {
    songData = loadLocalSongs();
  } catch (error) {
    console.error('Error loading songs data:', error);
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
    cookie: { 
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }
}));

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

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
    app.get(route, async (req, res) => {
        const {usernameLetter, name, email} = req.session;

        // Redirect to login if not authenticated
        if (!usernameLetter && !['/login', '/signup', '/reset-password'].includes(route)) {
            return res.redirect("/login");
        }

        // Get the user's profile picture if logged in
        let profilePicture = null;
        if (email) {
            try {
                // Get user ID
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', email), limit(1));
                const userSnapshot = await getDocs(q);
                
                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    profilePicture = userData.profilePicture || '/assets/profile/default-avatar.jpg';
                }
            } catch (error) {
                console.error('Error fetching profile picture:', error);
                profilePicture = '/assets/profile/default-avatar.jpg';
            }
        }

        // If route is "/profile", pass user details
        if (route === "/profile") {
            return res.render(view, {username: name, usermail: email, usernameLetter, profilePicture});
        }

        res.render(view, {usernameLetter, profilePicture});
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
    const {firstName, lastName, email, password, phoneNumber, username} = req.body;
    try {
        // Create the user with auth service
        await createUser({firstName, lastName, email, password, phoneNumber, username});
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

// Add API routes for user profile and favorites
app.get('/api/user/profile', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Get user data from Firestore
        const userEmail = req.session.email;
        
        // Get user profile from Firebase
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
        
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = userSnapshot.docs[0].data();
        
        res.json({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email,
            username: userData.username || '',
            phoneNumber: userData.phoneNumber || '',
            profilePicture: userData.profilePicture || '/assets/profile/default-avatar.jpg',
            preferences: userData.preferences || { theme: 'light', audioQuality: 'auto' }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update profile update endpoint to include phone number
app.put('/api/user/profile', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { firstName, lastName, username, phoneNumber } = req.body;
        const userEmail = req.session.email;
        
        // Get user reference
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userRef = doc(db, "users", userSnapshot.docs[0].id);
        
        // Update user data
        await updateDoc(userRef, {
            firstName: firstName || '',
            lastName: lastName || '',
            username: username || '',
            phoneNumber: phoneNumber || ''
        });
        
        // Update session data
        req.session.name = `${firstName} ${lastName}`;
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update the profile picture upload endpoint to use Cloudinary
app.post('/api/user/profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const userEmail = req.session.email;
        
        // Get user ID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = userSnapshot.docs[0].id;
        
        // Upload image to Cloudinary
        const imageURL = await uploadProfilePicture(
            req.file.buffer,
            userId,
            req.file.mimetype,
            // Callback to run after successful Cloudinary upload and Firebase update
            (secureUrl) => {
                // Emit refresh signal to all clients only after confirmed upload
                io.emit('refresh');
                console.log('Emitted refresh signal to all clients after Cloudinary confirmation');
            }
        );
        
        // Return the Cloudinary URL immediately so client gets a response
        res.json({ profilePicture: imageURL });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});

// Get user preferences
app.get('/api/user/preferences', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const userEmail = req.session.email;
        
        // Get user profile
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = userSnapshot.docs[0].data();
        
        // Ensure preferences exist, default to light theme and auto quality if not
        const preferences = userData.preferences || { theme: 'light', audioQuality: 'auto' };
        
        res.json(preferences);
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user preferences
app.put('/api/user/preferences', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const preferences = req.body;
        const userEmail = req.session.email;
        
        // Get user reference
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userDocId = userSnapshot.docs[0].id;
        const userRef = doc(db, "users", userDocId);
        
        // Update preferences
        await updateDoc(userRef, {
            preferences: preferences
        });
        
        // Log success for debugging
        console.log('Preferences updated successfully:', preferences);
        
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user favorites
app.get('/api/user/favorites', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const userEmail = req.session.email;
        
        // Get user favorites
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = userSnapshot.docs[0].data();
        const favorites = userData.favorites || [];
        
        console.log('Fetched user favorites:', favorites);
        
        // If no favorites, return empty array
        if (favorites.length === 0) {
            return res.json([]);
        }
        
        // Get song details for favorites - ensure we're comparing strings
        const favoriteTracksData = songData.filter(song => {
            const songIdStr = song.id.toString();
            return favorites.some(favId => favId.toString() === songIdStr);
        });
        
        console.log('Matched favorites with song data:', favoriteTracksData.length, 'songs');
        
        res.json(favoriteTracksData);
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add song to favorites
app.post('/api/user/favorites/:songId', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const songId = req.params.songId.toString(); // Ensure it's a string
        const userEmail = req.session.email;
        
        // Get user reference
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userDocId = userSnapshot.docs[0].id;
        const userData = userSnapshot.docs[0].data();
        const favorites = (userData.favorites || []).map(id => id.toString());
        
        // Check if song is already a favorite
        if (favorites.includes(songId)) {
            return res.json({ message: 'Song already in favorites' });
        }
        
        // Add song to favorites
        favorites.push(songId);
        
        // Update user document
        const userRef = doc(db, "users", userDocId);
        await updateDoc(userRef, {
            favorites: favorites
        });
        
        console.log('Added to favorites:', songId);
        
        // Emit targeted refresh event instead of a full refresh
        io.emit('refresh-favorites', songId);
        
        res.json({ message: 'Song added to favorites' });
    } catch (error) {
        console.error('Error adding song to favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove song from favorites
app.delete('/api/user/favorites/:songId', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const songId = req.params.songId.toString(); // Ensure it's a string
        const userEmail = req.session.email;
        
        // Get user reference
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const userSnapshot = await getDocs(q);
            
        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userDocId = userSnapshot.docs[0].id;
        const userData = userSnapshot.docs[0].data();
        const favorites = (userData.favorites || []).map(id => id.toString());
        
        // Remove song from favorites
        const updatedFavorites = favorites.filter(id => id !== songId);
        
        // Update user document
        const userRef = doc(db, "users", userDocId);
        await updateDoc(userRef, {
            favorites: updatedFavorites
        });
        
        console.log('Removed from favorites:', songId);
        
        // Emit targeted refresh event instead of a full refresh
        io.emit('refresh-favorites', songId);
        
        res.json({ message: 'Song removed from favorites' });
    } catch (error) {
        console.error('Error removing song from favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add logout route if it doesn't exist
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// 404 Error Handling
app.use((req, res) => {
    res.status(404).send(`<h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p><a href="/">Go back to homepage</a>`);
});

// Start the Server
server.listen(port, () => {
    console.log(`Server hosting at http://localhost:${port}`);
});
