import { auth, db, storage } from '../config/firebase.js';
import { 
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// DOM Elements
const personalInfoForm = document.getElementById('personal-info-form');
const securityForm = document.getElementById('security-form');
const deleteAccountBtn = document.getElementById('delete-account');
const profileAvatar = document.getElementById('profile-avatar');

// Initialize user data
async function initializeUserData() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData) {
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('username').value = userData.username || '';
            
            // Update profile stats
            if (userData.stats) {
                document.querySelector('.stat-value:nth-child(1)').textContent = userData.stats.playlists || 0;
                document.querySelector('.stat-value:nth-child(2)').textContent = userData.stats.followers || 0;
                document.querySelector('.stat-value:nth-child(3)').textContent = userData.stats.following || 0;
            }
        }

        // Update profile picture if exists
        if (user.photoURL) {
            profileAvatar.src = user.photoURL;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Error loading user data', 'error');
    }
}

// Handle personal information updates
personalInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('username').value.trim();

    try {
        // Update Firestore document
        await updateDoc(doc(db, 'users', user.uid), {
            firstName,
            lastName,
            username,
            updatedAt: new Date().toISOString()
        });

        // Update display name in Auth
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });

        showNotification('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
});

// Handle security form submission
securityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    try {
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        // Clear form
        securityForm.reset();
        showNotification('Password updated successfully', 'success');
    } catch (error) {
        console.error('Error updating password:', error);
        showNotification('Error updating password', 'error');
    }
});

// Handle profile picture upload
profileAvatar.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            // Upload to Firebase Storage
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Update auth profile
            await updateProfile(user, {
                photoURL: downloadURL
            });

            // Update profile picture
            profileAvatar.src = downloadURL;

            showNotification('Profile picture updated successfully', 'success');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showNotification('Error uploading profile picture', 'error');
        }
    };
    input.click();
});

// Handle account deletion
deleteAccountBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
        // Delete user data from Firestore
        await deleteDoc(doc(db, 'users', user.uid));

        // Delete profile picture from Storage
        if (user.photoURL) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            await deleteObject(storageRef);
        }

        // Delete user account
        await deleteUser(user);

        // Redirect to login page
        window.location.href = '/login';
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Error deleting account', 'error');
    }
});

// Notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize user data when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUserData); 