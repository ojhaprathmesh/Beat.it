const {auth, db} = require('./firebaseConfig');
const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    confirmPasswordReset
} = require('firebase/auth');
const {doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit} = require('firebase/firestore');
const dotenv = require('dotenv');

dotenv.config();

// Admin email addresses - this will be kept in sync with Firestore collection
const ADMIN_EMAILS = ['prathmeshojha2307@gmail.com'];

/**
 * Create a readable document ID from a username
 * @param {string} username - The username to convert
 * @returns {string} - A readable document ID
 */
const createReadableId = (username) => {
    // Remove special characters and spaces
    const sanitized = username.replace(/[^a-zA-Z0-9]/g, '');
    // Add timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    return `${sanitized}_${timestamp}`;
};

// Initialize the admin emails from Firestore
const initializeAdminEmails = async () => {
    try {
        // Check if admins collection exists and load existing admins
        const adminsRef = collection(db, 'admins');
        const adminsSnapshot = await getDocs(adminsRef);
        
        // Sync the ADMIN_EMAILS array with Firestore data
        ADMIN_EMAILS.length = 0; // Clear existing entries
        adminsSnapshot.forEach(doc => {
            const adminData = doc.data();
            if (adminData.email && !ADMIN_EMAILS.includes(adminData.email)) {
                ADMIN_EMAILS.push(adminData.email);
            }
        });
        console.log(`Loaded ${ADMIN_EMAILS.length} admin emails from Firestore`);
    } catch (error) {
        console.error('Error initializing admin emails:', error);
    }
};

// Initialize admin emails on startup
initializeAdminEmails().then();

// Completely disabled email notification functionality
const sendAdminLoginNotification = async (adminEmail) => {
    // This function is intentionally disabled to prevent email notification issues
    console.log('Email notifications are disabled');
    return Promise.resolve();
};

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

        // Determine if the user is an admin
        const isAdmin = ADMIN_EMAILS.includes(userData.email);
        
        // Create a readable document ID from username or email
        const username = userData.username || userData.email.split('@')[0];
        const readableId = createReadableId(username);
        
        // Store user data in Firestore using the readable ID
        await setDoc(doc(db, 'users', readableId), {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            username: userData.username || '',
            phoneNumber: userData.phoneNumber || '',
            profilePicture: '/assets/profile/default-avatar.jpg',
            favorites: [],
            preferences: {theme: 'light', audioQuality: 'auto'},
            isAdmin: isAdmin,
            authUid: userCredential.user.uid, // Store the auth UID for reference
            createdAt: new Date().toISOString()
            // Do not store password in Firestore as Firebase Auth handles this
        });
        
        // If user is admin, add them to admins collection with readable ID
        if (isAdmin) {
            const adminReadableId = `admin_${readableId}`;
            await setDoc(doc(db, 'admins', adminReadableId), {
                email: userData.email,
                userId: readableId,
                addedAt: new Date().toISOString()
            });
        }

        return {
            ...userCredential.user,
            readableId
        };
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
    console.log(`Login attempt for email: ${email}`);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Authentication successful for ${email}`);

    // Always ensure primary admin email is in ADMIN_EMAILS
    const isPrimaryAdmin = email === 'prathmeshojha2307@gmail.com';
    if (isPrimaryAdmin && !ADMIN_EMAILS.includes(email)) {
        ADMIN_EMAILS.push(email);
        console.log(`Added primary admin email to ADMIN_EMAILS list`);
    }

    // Find user document by email query
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const userSnapshot = await getDocs(q);
    
    if (userSnapshot.empty) {
        // Create a user document if it doesn't exist
        console.log(`User document not found for ${email}. Creating one now.`);
        
        // Determine if user should be an admin - force true for primary admin
        const isUserInAdminList = isPrimaryAdmin || ADMIN_EMAILS.includes(email);
        
        // Create readable ID for the new user
        const username = email.split('@')[0];
        const readableId = createReadableId(username);
        
        // Create basic user profile
        const userData = {
            firstName: username,
            lastName: '',
            email: email,
            username: username,
            phoneNumber: '',
            profilePicture: '/assets/profile/default-avatar.jpg',
            favorites: [],
            preferences: {theme: 'light', audioQuality: 'auto'},
            isAdmin: isUserInAdminList,
            authUid: userCredential.user.uid,
            createdAt: new Date().toISOString()
        };
        
        // Save to Firestore with readable ID
        await setDoc(doc(db, 'users', readableId), userData);
        console.log(`Created user document with isAdmin=${isUserInAdminList}`);
        
        // If admin, also add to admins collection with readable ID
        if (isUserInAdminList) {
            const adminReadableId = `admin_${readableId}`;
            await setDoc(doc(db, 'admins', adminReadableId), {
                email: email,
                userId: readableId,
                addedAt: new Date().toISOString()
            });
            console.log(`Added user to admins collection`);
        }
        
        return {
            uid: userCredential.user.uid,
            readableId: readableId,
            email: userCredential.user.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            phoneNumber: userData.phoneNumber,
            profilePicture: userData.profilePicture,
            isAdmin: isUserInAdminList
        };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const readableId = userDoc.id;
    console.log(`Loaded user document with isAdmin=${userData.isAdmin}`);
    
    // For the primary admin, always ensure admin status is true
    if (isPrimaryAdmin) {
        console.log(`Primary admin account detected, ensuring admin privileges`);
        
        if (!userData.isAdmin) {
            await updateDoc(doc(db, 'users', readableId), {
                isAdmin: true
            });
            userData.isAdmin = true;
            console.log(`Updated user document isAdmin to true`);
        }
        
        // Ensure in admins collection with readable ID
        const adminReadableId = `admin_${readableId}`;
        await setDoc(doc(db, 'admins', adminReadableId), {
            email: email,
            userId: readableId,
            addedAt: new Date().toISOString()
        });
        
        return {
            uid: userCredential.user.uid,
            readableId: readableId,
            email: userCredential.user.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            phoneNumber: userData.phoneNumber,
            profilePicture: userData.profilePicture,
            isAdmin: true
        };
    }
    
    // For other users, check admin status as normal
    const isAdmin = await isUserAdmin(email);
    
    // If user is admin but not marked as admin in DB, update their record
    if (isAdmin && !userData.isAdmin) {
        await updateDoc(doc(db, 'users', readableId), {
            isAdmin: true
        });
        userData.isAdmin = true;
        console.log(`Updated user document isAdmin to true`);
    }

    return {
        uid: userCredential.user.uid,
        readableId: readableId,
        email: userCredential.user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        phoneNumber: userData.phoneNumber,
        profilePicture: userData.profilePicture,
        isAdmin: isAdmin
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

/**
 * Check if a user is an admin
 */
const isUserAdmin = async (email) => {
    console.log(`Checking admin status for email: ${email}`);
    
    // Special case for primary admin
    if (email === 'prathmeshojha2307@gmail.com') {
        console.log('Primary admin email detected. Admin access granted.');
        
        // Ensure in ADMIN_EMAILS
        if (!ADMIN_EMAILS.includes(email)) {
            ADMIN_EMAILS.push(email);
        }
        
        return true;
    }
    
    // First check against the in-memory admin list for faster response
    if (ADMIN_EMAILS.includes(email)) {
        console.log(`- Found in ADMIN_EMAILS list. Email is admin.`);
        return true;
    }
    
    // Then check in the admins collection
    try {
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // Add to in-memory cache for future checks
            if (!ADMIN_EMAILS.includes(email)) {
                ADMIN_EMAILS.push(email);
                console.log(`- Found in admins collection. Added to ADMIN_EMAILS. Email is admin.`);
            } else {
                console.log(`- Found in admins collection. Email is admin.`);
            }
            return true;
        } else {
            console.log(`- Not found in admins collection.`);
        }
    } catch (error) {
        console.error('Error checking admin status in admins collection:', error);
    }
    
    // Fallback: check isAdmin flag in users collection 
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email), where('isAdmin', '==', true), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // If we find an admin user, add them to the admins collection for future checks
            try {
                const userDoc = snapshot.docs[0];
                const readableId = userDoc.id;
                const adminReadableId = `admin_${readableId}`;
                
                await setDoc(doc(db, 'admins', adminReadableId), {
                    email: email,
                    userId: readableId,
                    addedAt: new Date().toISOString()
                });
                
                // Add to in-memory cache
                if (!ADMIN_EMAILS.includes(email)) {
                    ADMIN_EMAILS.push(email);
                }
                console.log(`- Found in users collection with isAdmin=true. Added to admins collection. Email is admin.`);
                return true;
            } catch (error) {
                console.error('Error adding admin to admins collection:', error);
                // Even if we couldn't add to admins collection, the user is still an admin
                console.log(`- Found in users collection with isAdmin=true. Email is admin.`);
                return true;
            }
        }
        
        console.log(`- Not found in users collection with isAdmin=true. Email is NOT admin.`);
        return false;
    } catch (error) {
        console.error('Error checking admin status in users collection:', error);
        return false;
    }
};

/**
 * Promote a user to admin
 */
const promoteUserToAdmin = async (userEmail, adminEmail) => {
    // Verify that the requestor is an admin
    const isAdmin = await isUserAdmin(adminEmail);
    if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can promote users');
    }
    
    // Find the user to promote
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail), limit(1));
    const userSnapshot = await getDocs(q);
    
    if (userSnapshot.empty) {
        throw new Error('User not found');
    }
    
    const userDoc = userSnapshot.docs[0];
    const readableId = userDoc.id;
    
    // Update the user to an admin in users collection
    await updateDoc(doc(db, 'users', readableId), {
        isAdmin: true
    });
    
    // Add to admins collection with readable ID
    const adminReadableId = `admin_${readableId}`;
    await setDoc(doc(db, 'admins', adminReadableId), {
        email: userEmail,
        userId: readableId,
        addedAt: new Date().toISOString(),
        promotedBy: adminEmail
    });
    
    // Add to admin emails array if not already there
    if (!ADMIN_EMAILS.includes(userEmail)) {
        ADMIN_EMAILS.push(userEmail);
    }
    
    return { message: `User ${userEmail} has been promoted to admin` };
};

module.exports = {
    createUser, 
    loginUser, 
    forgotPassword, 
    resetPassword, 
    isUserAdmin,
    promoteUserToAdmin,
    ADMIN_EMAILS,
    initializeAdminEmails
};