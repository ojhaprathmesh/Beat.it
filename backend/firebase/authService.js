const {auth, db} = require('./firebaseConfig');
const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    confirmPasswordReset
} = require('firebase/auth');
const {doc, setDoc, getDoc} = require('firebase/firestore');

/**
 * Register a new user with Firebase Authentication and store additional data in the Firestore
 */
const createUser = async (userData) => {
    try {
        // Create an auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
        );

        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            username: userData.username || '',
            phoneNumber: userData.phoneNumber || '',
            profilePicture: '/assets/profile/default-avatar.jpg',
            favorites: [],
            preferences: {theme: 'light', audioQuality: 'auto'},
            createdAt: new Date().toISOString()
            // Do not store password in Firestore as Firebase Auth handles this
        });

        return userCredential.user;
    } catch (error) {
        // Translate Firebase error codes to match your existing API response format
        if (error.code === 'auth/email-already-in-use') {
            const customError = new Error('Email already exists.');
            customError.code = 'auth/email-already-exists';
            throw customError;
        }
        throw error;
    }
};

/**
 * Log in a user with Firebase Authentication
 */
const loginUser = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
        throw new Error('User profile not found');
    }

    const userData = userDoc.data();

    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        phoneNumber: userData.phoneNumber,
        profilePicture: userData.profilePicture
    };
};

/**
 * Send password reset email using Firebase Auth
 */
const forgotPassword = async (email) => {
    try {
        // Get the action code settings
        const actionCodeSettings = {
            // URL you want to redirect back to after password reset.
            // Must include oobCode in the URL it redirects to
            url: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`,
            // Pass the oobCode to the reset page via the URL
            handleCodeInApp: true
        };

        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return true;
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            throw new Error('Email not associated with any account.');
        }
        throw error;
    }
};

/**
 * Reset password with a token
 */
const resetPassword = async (token, newPassword) => {
    try {
        // Confirm the password reset if the code is valid
        await confirmPasswordReset(auth, token, newPassword);

        return true;
    } catch (error) {
        if (error.code === 'auth/invalid-action-code' ||
            error.code === 'auth/expired-action-code') {
            throw new Error('Invalid or expired token.');
        }
        throw error;
    }
};

module.exports = {createUser, loginUser, forgotPassword, resetPassword};