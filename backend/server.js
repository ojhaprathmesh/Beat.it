const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require("express-session");
const dotenv = require('dotenv');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

// Firebase imports
const {db} = require('./firebase/firebaseConfig');
const {collection, query, where, getDocs, doc, updateDoc, limit, getDoc, setDoc, deleteDoc} = require('firebase/firestore');
const {createUser, loginUser, forgotPassword, resetPassword, isUserAdmin, promoteUserToAdmin, ADMIN_EMAILS, loadAdminEmails, deleteUserAccount} = require('./firebase/authService');

// Import Cloudinary image service
const {uploadProfilePicture} = require('./cloudinary/imageService');

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

        // If we couldn't load data from the file, return an empty array
        console.warn('Could not load data from songsData.json');
        return [];
    } catch (error) {
        console.error('Error loading songs:', error);
        return [];
    }
}

const app = express();
const port = 3000;

// Create an HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Initialize Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle refresh-favorite event
    socket.on('refresh-favorites', (songId) => {
        // Broadcast to all clients except sender
        socket.broadcast.emit('refresh-favorites', songId);
    });

    // Listen for user to fetch their favorites
    socket.on('fetch-favorites', async (userId) => {
        try {
            const favorites = await getFavoritesForUser(userId);
            
            // Load song data for favorites
            const favoriteTracksData = [];
            for (const songId of favorites) {
                const song = songsData.find(s => s.id.toString() === songId.toString());
                if (song) {
                    favoriteTracksData.push(song);
                }
            }
            
            // Only log once per socket connection
            if (!socket.loggedFavorites) {
                console.log('Fetched user favorites:', favorites);
                console.log('Matched favorites with song data:', favoriteTracksData.length, 'songs');
                socket.loggedFavorites = true;
            }
            
            socket.emit('favorites-data', favoriteTracksData);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            socket.emit('error', { message: 'Failed to fetch favorites' });
        }
    });

    // Add a custom logging function that prevents duplicate logs
    socket.log = function(type, data) {
        // Only log if we haven't logged this type of message before
        if (!socket.loggedMessages) {
            socket.loggedMessages = {};
        }
        
        // For favorites, only log the first time or when the count changes
        if (type === 'favorites') {
            const previousLog = socket.loggedMessages[type];
            if (!previousLog || previousLog.count !== data.count) {
                console.log('Fetched user favorites:', data.favorites);
                console.log('Matched favorites with song data:', data.count, 'songs');
                socket.loggedMessages[type] = data;
            }
        } else if (!socket.loggedMessages[type]) {
            // For other types, log only once
            console.log(`${type}:`, data);
            socket.loggedMessages[type] = true;
        }
    };

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Load songs from the file if they weren't loaded earlier
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

// Debug middleware to log session data
app.use((req, res, next) => {
    if (req.path === '/admin' || req.path.startsWith('/api/admin')) {
        console.log('Session data for admin path:', {
            path: req.path,
            email: req.session.email,
            isAdmin: req.session.isAdmin,
            usernameLetter: req.session.usernameLetter,
        });
    }
    next();
});

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

// Helper function to fetch user by email - eliminates duplicate code
async function getUserByEmail(email) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
        return null;
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id; // This is now the readable ID

    return {userData, userId};
}

// Set song data in response locals for rendering
app.use((req, res, next) => {
    // Load album data from albumsData.json for correct album names
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
    "/album": "AlbumPage",
    "/reset-password": "ResetPasswordPage",
    "/admin": "AdminPage"
};

// Search route is handled separately because it needs the query parameter
app.get("/search", async (req, res) => {
    const {usernameLetter, name, email, isAdmin} = req.session;
    const query = req.query.query || '';

    // Redirect to log in if not authenticated
    if (!usernameLetter) {
        console.log(`Redirecting unauthenticated user from /search to /login`);
        return res.redirect("/login");
    }

    // Get the user's profile picture if logged in
    let profilePicture = null;
    if (email) {
        try {
            const user = await getUserByEmail(email);
            if (user) {
                profilePicture = user.userData.profilePicture || '/assets/profile/default-avatar.jpg';
            }
        } catch (error) {
            console.error('Error fetching profile picture:', error);
            profilePicture = '/assets/profile/default-avatar.jpg';
        }
    }

    res.render("SearchPage", {usernameLetter, profilePicture, isAdmin, query});
});

Object.entries(pageRoutes).forEach(([route, view]) => {
    // Skip search route as it's handled separately
    if (route === "/search") return;
    
    app.get(route, async (req, res) => {
        const {usernameLetter, name, email, isAdmin} = req.session;

        // Debugging info to help troubleshoot issues
        if (route === '/admin') {
            console.log('Admin page access attempt:');
            console.log('- Email:', email);
            console.log('- Session isAdmin:', isAdmin);
            if (email) {
                const adminStatus = await isUserAdmin(email);
                console.log('- Current isAdmin status:', adminStatus);
                
                // Update session if needed
                if (adminStatus && !isAdmin) {
                    req.session.isAdmin = true;
                    console.log('- Updated session isAdmin to true');
                }
            }
        }

        // Redirect to log in if not authenticated
        if (!usernameLetter && !['/login', '/signup', '/reset-password'].includes(route)) {
            console.log(`Redirecting unauthenticated user from ${route} to /login`);
            return res.redirect("/login");
        }

        // Check for admin access to admin page
        if (route === '/admin') {
            // Double-check admin status
            if (email && !isAdmin) {
                const adminStatus = await isUserAdmin(email);
                if (adminStatus) {
                    req.session.isAdmin = true;
                } else {
                    console.log('Non-admin user attempted to access admin page. Redirecting to /home');
                    return res.redirect("/home");
                }
            } else if (!email || !isAdmin) {
                console.log('Non-admin user attempted to access admin page. Redirecting to /home');
                return res.redirect("/home");
            }
        }

        // Get the user's profile picture if logged in
        let profilePicture = null;
        if (email) {
            try {
                const user = await getUserByEmail(email);
                if (user) {
                    profilePicture = user.userData.profilePicture || '/assets/profile/default-avatar.jpg';
                }
            } catch (error) {
                console.error('Error fetching profile picture:', error);
                profilePicture = '/assets/profile/default-avatar.jpg';
            }
        }

        // If the route is "/profile", pass user details
        if (route === "/profile") {
            return res.render(view, {username: name, usermail: email, usernameLetter, profilePicture, isAdmin});
        }

        res.render(view, {usernameLetter, profilePicture, isAdmin});
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

    // Otherwise read from the file
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
        const user = await createUser({firstName, lastName, email, password, phoneNumber, username});
        
        // Set session data to log the user in automatically
        req.session.usernameLetter = email.charAt(0).toUpperCase();
        req.session.email = email;
        req.session.name = `${firstName} ${lastName}`;
        req.session.isAdmin = await isUserAdmin(email);
        
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

        // Double check admin status
        const adminStatus = await isUserAdmin(email);

        // Set session data
        req.session.usernameLetter = email.charAt(0).toUpperCase();
        req.session.email = email;
        req.session.name = `${user.firstName} ${user.lastName}`;
        req.session.isAdmin = adminStatus;

        res.status(200).json({
            message: "Login successful!",
            isAdmin: adminStatus
        });
    } catch (error) {
        console.error('Login error:', error);
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

// New endpoint for resetting password with a token
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
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        // Get user data from Firestore using helper function
        const user = await getUserByEmail(req.session.email);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const userData = user.userData;

        res.json({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email,
            username: userData.username || '',
            phoneNumber: userData.phoneNumber || '',
            profilePicture: userData.profilePicture || '/assets/profile/default-avatar.jpg',
            preferences: userData.preferences || {theme: 'light', audioQuality: 'auto'}
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Update profile update endpoint to include phone number
app.put('/api/user/profile', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const {firstName, lastName, username, phoneNumber} = req.body;
        const user = await getUserByEmail(req.session.email);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const userRef = doc(db, "users", user.userId);

        // Update user data
        await updateDoc(userRef, {
            firstName: firstName || '',
            lastName: lastName || '',
            username: username || '',
            phoneNumber: phoneNumber || ''
        });

        // Update session data
        req.session.name = `${firstName} ${lastName}`;

        res.json({message: 'Profile updated successfully'});
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Update the profile picture upload endpoint to use Cloudinary
app.post('/api/user/profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        if (!req.file) {
            return res.status(400).json({error: 'No file uploaded'});
        }

        const user = await getUserByEmail(req.session.email);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Upload image to Cloudinary
        const imageURL = await uploadProfilePicture(
            req.file.buffer,
            user.userId,
            req.file.mimetype,
            // Callback to run after a successful Cloudinary upload and Firebase update
            () => {
                // Emit refresh signal to all clients only after a confirmed upload
                io.emit('refresh');
                console.log('Emitted refresh signal to all clients after Cloudinary confirmation');
            }
        );

        // Return the Cloudinary URL immediately so the client gets a response
        res.json({profilePicture: imageURL});
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({error: 'Failed to update profile picture'});
    }
});

// Get user preferences
app.get('/api/user/preferences', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const user = await getUserByEmail(req.session.email);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Ensure preferences exist, default to light theme and auto quality if not
        const preferences = user.userData.preferences || {theme: 'light', audioQuality: 'auto'};

        res.json(preferences);
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Update user preferences
app.put('/api/user/preferences', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const preferences = req.body;
        const user = await getUserByEmail(req.session.email);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const userRef = doc(db, "users", user.userId);

        // Update preferences
        await updateDoc(userRef, {
            preferences: preferences
        });

        // Log success for debugging
        console.log('Preferences updated successfully:', preferences);

        res.json({message: 'Preferences updated successfully'});
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Get user favorites
app.get('/api/user/favorites', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const user = await getUserByEmail(req.session.email);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const favorites = user.userData.favorites || [];

        // Log favorites only in development environment
        if (process.env.NODE_ENV !== 'production') {
            console.log('Fetched user favorites:', favorites);
        }

        // If no favorites, return an empty array
        if (favorites.length === 0) {
            return res.json([]);
        }

        // Get song details for favorites - ensure we're comparing strings
        const favoriteTracksData = songData.filter(song => {
            const songIdStr = song.id.toString();
            return favorites.some(favId => favId.toString() === songIdStr);
        });

        // Log match count only in development environment
        if (process.env.NODE_ENV !== 'production') {
            console.log('Matched favorites with song data:', favoriteTracksData.length, 'songs');
        }

        res.json(favoriteTracksData);
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Helper function to update favorites
async function updateFavorites(email, songId, action) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }

    const userDocId = user.userId;
    const userData = user.userData;
    const favorites = (userData.favorites || []).map(id => id.toString());

    let updatedFavorites = favorites;

    if (action === 'add') {
        // Check if a song is already a favorite
        if (favorites.includes(songId)) {
            return {message: 'Song already in favorites'};
        }
        updatedFavorites = [...favorites, songId];
    } else if (action === 'remove') {
        updatedFavorites = favorites.filter(id => id !== songId);
    }

    // Update user document
    const userRef = doc(db, "users", userDocId);
    await updateDoc(userRef, {
        favorites: updatedFavorites
    });

    console.log(`${action === 'add' ? 'Added to' : 'Removed from'} favorites:`, songId);

    return {message: action === 'add' ? 'Song added to favorites' : 'Song removed from favorites'};
}

// Add song to favorites
app.post('/api/user/favorites/:songId', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const songId = req.params.songId.toString(); // Ensure it's a string
        const result = await updateFavorites(req.session.email, songId, 'add');

        // Emit targeted refresh event
        io.emit('refresh-favorites', songId);

        res.json(result);
    } catch (error) {
        console.error('Error adding song to favorites:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Remove song from favorites
app.delete('/api/user/favorites/:songId', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const songId = req.params.songId.toString(); // Ensure it's a string
        const result = await updateFavorites(req.session.email, songId, 'remove');

        // Emit targeted refresh event
        io.emit('refresh-favorites', songId);

        res.json(result);
    } catch (error) {
        console.error('Error removing song from favorites:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Add a logout route if it doesn't exist
app.get('/logout', (req, res) => {
    console.log('GET logout route hit, destroying session');
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.post('/api/logout', (req, res) => {
    console.log('POST logout route hit, destroying session');
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({error: 'Internal server error'});
        }
        res.clearCookie('connect.sid');
        res.status(200).json({message: 'Logged out successfully'});
    });
});

// Admin API Routes

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    if (!req.session.isAdmin) {
        // Double-check in case session is out of date
        const adminStatus = await isUserAdmin(req.session.email);
        if (!adminStatus) {
            return res.status(403).json({error: 'Forbidden: Admin access required'});
        }
        // Update session if admin status has changed
        req.session.isAdmin = true;
    }

    next();
};

// Get system stats for admin dashboard
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
    try {
        // Get total songs count
        const totalSongs = songData.length;

        // Get total users count
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;

        // Get top 5 played songs (assuming each song has a play count)
        const topPlayedSongs = songData
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 5)
            .map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                playCount: song.playCount || 0
            }));

        // Calculate storage usage (placeholder - implement actual calculation)
        const storageUsed = {
            total: "500 MB", // Placeholder value
            used: "125 MB",   // Placeholder value
            percentage: 25     // Placeholder value
        };

        // Get recent activity (placeholder - implement actual logs)
        const recentActivity = [
            { type: 'upload', user: 'user@example.com', item: 'New Song.mp3', timestamp: new Date().toISOString() },
            { type: 'like', user: 'another@example.com', item: 'Popular Song', timestamp: new Date(Date.now() - 3600000).toISOString() }
        ];

        res.json({
            totalSongs,
            totalUsers,
            topPlayedSongs,
            storageUsed,
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({error: 'Failed to fetch admin statistics'});
    }
});

// Get all users for admin management
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                email: userData.email,
                name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                username: userData.username || '',
                isAdmin: userData.isAdmin || false,
                profilePicture: userData.profilePicture || '/assets/profile/default-avatar.jpg',
                createdAt: userData.createdAt
            });
        });
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({error: 'Failed to fetch users'});
    }
});

// Create a new user from admin panel
app.post('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Validate required fields
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password and username are required' });
        }
        
        // Create user with basic information
        const userData = {
            firstName: username.split(' ')[0] || '',
            lastName: username.split(' ').slice(1).join(' ') || '',
            email,
            password,
            username
        };
        
        // Create the user with Firebase Auth
        const user = await createUser(userData);
        
        // If role is admin, promote the user to admin
        if (role === 'admin') {
            await promoteUserToAdmin(email, req.session.email);
        }
        
        res.status(201).json({ 
            message: 'User created successfully',
            id: user.uid
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(error.code === 'auth/email-already-exists' ? 400 : 500)
           .json({ error: error.message || 'Failed to create user' });
    }
});

// Get a single user by ID for editing
app.get('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        // userId is now a readable ID, so we can directly access it
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = userDoc.data();
        
        res.json({
            id: userDoc.id, // This is the readable ID
            authUid: userData.authUid, // Include the Firebase Auth UID
            email: userData.email,
            username: userData.username || '',
            role: userData.isAdmin ? 'admin' : 'user',
            profilePicture: userData.profilePicture || '/assets/profile/default-avatar.jpg',
            createdAt: userData.createdAt
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update a user
app.put('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { username, email, role } = req.body;
        
        // userId is now a readable ID
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = userDoc.data();
        const wasAdmin = userData.isAdmin;
        const willBeAdmin = role === 'admin';
        
        // Update the user data - userId is the readable ID
        await updateDoc(doc(db, 'users', userId), {
            username: username || '',
            email: email || userData.email,
            isAdmin: willBeAdmin
        });
        
        // If changing to admin role, update ADMIN_EMAILS
        if (!wasAdmin && willBeAdmin && !ADMIN_EMAILS.includes(email)) {
            ADMIN_EMAILS.push(email);
        }
        
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete a user
app.delete('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    // Note: This is a stub - Firebase doesn't directly support deleting users from client SDK
    // In a real application, you would need to use Firebase Admin SDK or Cloud Functions
    res.status(501).json({ error: 'User deletion not implemented yet' });
});

// Promote user to admin
app.post('/api/admin/promote-user', adminMiddleware, async (req, res) => {
    try {
        const {userEmail} = req.body;
        
        if (!userEmail) {
            return res.status(400).json({error: 'User email is required'});
        }
        
        const result = await promoteUserToAdmin(userEmail, req.session.email);
        res.json(result);
    } catch (error) {
        console.error('Error promoting user:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500)
           .json({error: error.message || 'Failed to promote user'});
    }
});

// Get all songs for admin management
app.get('/api/admin/songs', adminMiddleware, async (req, res) => {
    try {
        res.json(songData);
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({error: 'Failed to fetch songs'});
    }
});

// Upload new song (placeholder)
app.post('/api/admin/songs/upload', adminMiddleware, upload.single('songFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'No file uploaded'});
        }
        
        // Placeholder response - actual implementation would save the file and update DB
        res.json({
            message: 'Song upload placeholder - implementation pending',
            filename: req.file.originalname
        });
    } catch (error) {
        console.error('Error uploading song:', error);
        res.status(500).json({error: 'Failed to upload song'});
    }
});

// Update song metadata
app.put('/api/admin/songs/:songId', adminMiddleware, async (req, res) => {
    try {
        const { songId } = req.params;
        const { title, artist, album, genre } = req.body;
        
        // Find the song in the array
        const songIndex = songData.findIndex(song => song.id.toString() === songId.toString());
        
        if (songIndex === -1) {
            return res.status(404).json({error: 'Song not found'});
        }
        
        // Update the song in memory
        songData[songIndex] = {
            ...songData[songIndex],
            title: title || songData[songIndex].title,
            artist: artist || songData[songIndex].artist,
            album: album || songData[songIndex].album,
            genre: genre || songData[songIndex].genre
        };
        
        // Write the updated data to the JSON file
        fs.writeFileSync(
            path.join(__dirname, '../frontend/public/data/songsData.json'),
            JSON.stringify(songData, null, 2)
        );
        
        res.json({
            message: 'Song updated successfully',
            song: songData[songIndex]
        });
    } catch (error) {
        console.error('Error updating song:', error);
        res.status(500).json({error: 'Failed to update song'});
    }
});

// Delete song
app.delete('/api/admin/songs/:songId', adminMiddleware, async (req, res) => {
    try {
        const { songId } = req.params;
        
        // Find the song in the array
        const songIndex = songData.findIndex(song => song.id.toString() === songId.toString());
        
        if (songIndex === -1) {
            return res.status(404).json({error: 'Song not found'});
        }
        
        // Remove the song from memory
        const removedSong = songData.splice(songIndex, 1)[0];
        
        // Write the updated data to the JSON file
        fs.writeFileSync(
            path.join(__dirname, '../frontend/public/data/songsData.json'),
            JSON.stringify(songData, null, 2)
        );
        
        res.json({
            message: 'Song deleted successfully',
            song: removedSong
        });
    } catch (error) {
        console.error('Error deleting song:', error);
        res.status(500).json({error: 'Failed to delete song'});
    }
});

// Get all storage usage (Vercel Blob integration placeholder)
app.get('/api/admin/storage', adminMiddleware, async (req, res) => {
    try {
        // Placeholder response - actual implementation would query Vercel Blob API
        res.json({
            totalStorage: '1 GB',
            usedStorage: '250 MB',
            files: [
                { name: 'song1.mp3', size: '5 MB', type: 'audio/mp3', url: '/songs/song1.mp3', uploaded: new Date().toISOString() },
                { name: 'album-cover.jpg', size: '1 MB', type: 'image/jpeg', url: '/images/album-cover.jpg', uploaded: new Date().toISOString() }
            ]
        });
    } catch (error) {
        console.error('Error fetching storage info:', error);
        res.status(500).json({error: 'Failed to fetch storage information'});
    }
});

// Initialize admin data
(async function() {
    try {
        await loadAdminEmails();
        console.log('Admin data initialized successfully');
    } catch (error) {
        console.error('Error initializing admin data:', error);
    }
})();

// Add a specific route for the admin page to ensure it works
app.get('/admin', async (req, res) => {
    console.log('Admin page access attempt');
    
    // If not logged in, redirect to login
    if (!req.session.email) {
        console.log('Not logged in, redirecting to login');
        return res.redirect('/login');
    }
    
    // Check admin status directly
    const isAdmin = await isUserAdmin(req.session.email);
    console.log(`Admin status for ${req.session.email}: ${isAdmin}`);
    
    if (!isAdmin) {
        console.log('Not an admin, redirecting to home');
        return res.redirect('/home');
    }
    
    // Update session
    req.session.isAdmin = true;
    
    // Get user data
    let userData = {
        username: req.session.name || req.session.email.split('@')[0],
        email: req.session.email,
        profilePicture: '/assets/profile/default-avatar.jpg'
    };
    
    try {
        const user = await getUserByEmail(req.session.email);
        if (user) {
            userData.profilePicture = user.userData.profilePicture || '/assets/profile/default-avatar.jpg';
            userData.username = user.userData.username || req.session.name || req.session.email.split('@')[0];
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
    
    // Render the admin page
    res.render('AdminPage', {
        usernameLetter: req.session.usernameLetter,
        profilePicture: userData.profilePicture,
        isAdmin: true,
        user: userData
    });
});

// Admin section routes
app.get('/admin/sections/:section', async (req, res) => {
    // Check if admin
    if (!req.session.isAdmin) {
        return res.status(403).send('Access denied');
    }

    const section = req.params.section;
    const allowedSections = ['dashboard', 'users', 'songs', 'artists', 'storage', 'analytics'];
    
    if (!allowedSections.includes(section)) {
        return res.status(404).send('Section not found');
    }
    
    try {
        res.render(`admin/sections/${section}`, {
            user: {
                username: req.session.name || req.session.email.split('@')[0]
            }
        });
    } catch (error) {
        console.error(`Error rendering admin section ${section}:`, error);
        res.status(500).send(`<div class="admin-error">Error loading section</div>`);
    }
});

// Save user preferences
app.post('/api/user/preferences', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const userId = req.session.userId || (await getUserByEmail(req.session.email))?.userId;
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { theme, audioQuality } = req.body;
        
        // Get current user document
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get current preferences
        const userData = userDoc.data();
        const currentPrefs = userData.preferences || {};
        
        // Update only the provided preferences
        const updatedPrefs = {
            ...currentPrefs,
            ...(theme !== undefined && { theme }),
            ...(audioQuality !== undefined && { audioQuality })
        };
        
        // Save updated preferences
        await updateDoc(userRef, { preferences: updatedPrefs });
        
        res.status(200).json({ 
            message: 'Preferences updated successfully',
            preferences: updatedPrefs
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Add search API endpoint
app.get('/api/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    
    if (!query || query.trim() === '') {
        return res.json({
            songs: [],
            artists: [],
            albums: []
        });
    }
    
    // Search through songs
    const matchedSongs = songData.filter(song => {
        return (
            song.title.toLowerCase().includes(query) ||
            song.artist.some(artist => artist.toLowerCase().includes(query)) ||
            song.album.toLowerCase().includes(query)
        );
    });
    
    // Extract unique artists from matched songs
    const artists = [...new Set(
        matchedSongs.flatMap(song => song.artist)
            .filter(artist => artist.toLowerCase().includes(query))
    )];
    
    // Extract unique albums from matched songs
    const albums = [...new Set(
        matchedSongs
            .filter(song => song.album.toLowerCase().includes(query))
            .map(song => song.album)
    )];
    
    res.json({
        songs: matchedSongs,
        artists,
        albums
    });
});

// Delete user account
app.post('/api/user/delete-account', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }
        
        // Call the deleteUserAccount function from authService
        const result = await deleteUserAccount(req.session.email, password);
        
        // Destroy the session
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'Account deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(400).json({ error: error.message || 'Failed to delete account' });
    }
});

// 404 Error Handling
app.use((req, res) => {
    res.status(404).send(`<h1>404—Page Not Found</h1><p>The page you're looking for doesn't exist.</p><a href="/">Go back to the homepage</a>`);
});

// Start the Server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
