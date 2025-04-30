require('dotenv').config();
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Only initialize Firebase if not disabled
let auth = null;
let db = null;
let adminApp = null;
let isEnabled = true;

// Check if we're in development mode
if (process.env.NODE_ENV === 'development' || process.env.DISABLE_FIREBASE === 'true') {
    console.log('Running in development mode - Firebase is disabled');
    isEnabled = false;
} else {
    try {
        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        };

        // Initialize Firebase Client SDK
        const clientApp = initializeApp(firebaseConfig);
        auth = getAuth(clientApp);
        db = getFirestore(clientApp);

        // Initialize Firebase Admin SDK
        if (process.env.NODE_ENV === 'production') {
            const serviceAccount = require('./serviceAccountKey.json');
            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
    } catch (error) {
        console.warn('Firebase initialization error:', error.message);
        console.warn('Running without Firebase functionality');
        isEnabled = false;
    }
}

// Helper function for email/password sign in
const signInWithEmail = async (email, password) => {
    if (!auth) {
        throw new Error('Firebase authentication not initialized');
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

// Helper function for email/password registration
const createUserWithEmail = async (email, password) => {
    if (!auth) {
        throw new Error('Firebase authentication not initialized');
    }
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return userCredential;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

module.exports = { 
    auth, 
    db, 
    admin: adminApp,
    signInWithEmail,
    createUserWithEmail,
    isEnabled
}; 