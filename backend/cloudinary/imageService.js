const { cloudinary } = require('./cloudinaryConfig');
const { db } = require('../firebase/firebaseConfig');
const { doc, updateDoc, getDoc } = require('firebase/firestore');
const stream = require('stream');

/**
 * Upload a profile picture to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} userId - The user ID
 * @param {string} fileType - The file type (e.g., image/jpeg)
 * @param {Function} [onSuccess] - Optional callback to run after successful upload
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
async function uploadProfilePicture(fileBuffer, userId, fileType, onSuccess) {
  try {
    // Create a stream from the buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'profile-pictures',
        public_id: `user_${userId}`,
        overwrite: true,
        resource_type: 'auto'
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          throw error;
        }
        
        // Update user document with profile picture URL
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            profilePicture: result.secure_url
          });
          
          // If a success callback was provided, call it with the secure URL
          if (typeof onSuccess === 'function') {
            onSuccess(result.secure_url);
          }
        } catch (dbError) {
          console.error('Error updating user profile with image URL:', dbError);
        }
      }
    );

    // Create a readable stream from the buffer and pipe to the upload stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
    
    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      uploadStream.on('end', () => {
        // This is called when the stream has finished, but before the callback
        // The actual URL will be handled in the callback above
      });
      uploadStream.on('error', reject);
      
      // Since we can't easily get the result from the callback to here,
      // we'll query the user document after a brief delay
      setTimeout(async () => {
        try {
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            resolve(userDoc.data().profilePicture);
          } else {
            reject(new Error('User document not found'));
          }
        } catch (error) {
          reject(error);
        }
      }, 1000); // Wait for the callback to complete
    });
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
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