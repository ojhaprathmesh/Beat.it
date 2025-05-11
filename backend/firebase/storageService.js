const { storage } = require('./firebaseConfig');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { updateDoc, doc, getDoc } = require('firebase/firestore');
const { db } = require('./firebaseConfig');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload a profile picture to Firebase Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} userId - The user ID
 * @param {string} fileType - The file type (e.g., image/jpeg)
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
async function uploadProfilePicture(fileBuffer, userId, fileType) {
    try {
        // Determine file extension
        const extension = fileType.split('/')[1] || 'jpg';
        
        // Create a unique filename
        const filename = `${userId}_${uuidv4()}.${extension}`;
        
        // Create a reference to the file in Firebase Storage
        const storageRef = ref(storage, `profile-pictures/${filename}`);
        
        // Upload the file
        const snapshot = await uploadBytes(storageRef, fileBuffer, {
            contentType: fileType
        });
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Update user document with profile picture URL
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            profilePicture: downloadURL
        });
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
}

/**
 * Get the profile picture URL for a user
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - The profile picture URL or null if not found
 */
async function getProfilePictureURL(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        return userDoc.data().profilePicture || null;
    } catch (error) {
        console.error('Error getting profile picture URL:', error);
        throw error;
    }
}

module.exports = {
    uploadProfilePicture,
    getProfilePictureURL
}; 