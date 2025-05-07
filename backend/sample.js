// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);