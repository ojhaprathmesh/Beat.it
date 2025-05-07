// Import the Firebase app instance from sample.js
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

// Firebase configuration from sample.js
const firebaseConfig = {
  apiKey: "AIzaSyCMgX5pNFu3yvZgIlYWkYxI-8bhjJ_ljl4",
  authDomain: "beat-it-a792a.firebaseapp.com",
  projectId: "beat-it-a792a",
  storageBucket: "beat-it-a792a.firebasestorage.app",
  messagingSenderId: "34902992651",
  appId: "1:34902992651:web:8bb5535c4b4844f215640e",
  measurementId: "G-MNP1M5XKS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { app, auth, db, storage }; 