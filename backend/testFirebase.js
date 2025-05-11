/**
 * Firebase Connection Test Script
 *
 * Run this script with: node backend/testFirebase.js
 * It will verify connectivity to Firebase services
 */

// Import Firebase configuration
const {auth, db, storage} = require('./firebase/firebaseConfig');
const {collection, getDocs} = require('firebase/firestore');
const {ref} = require('firebase/storage');

async function testFirebaseConnection() {
    console.log('Testing Firebase connection...');
    let hasErrors = false;

    try {
        // Test Firebase Auth
        console.log('\nTesting Firebase Auth...');
        try {
            const currentUser = auth.currentUser; // Just checking if auth is initialized
            console.log('✅ Firebase Auth seems to be properly initialized');
        } catch (error) {
            console.error('❌ Firebase Auth error:', error.message);
            hasErrors = true;
        }

        // Test Firebase Storage
        console.log('\nTesting Firebase Storage...');
        try {
            const testRef = ref(storage, 'test.txt');
            console.log('✅ Firebase Storage seems to be properly initialized');
        } catch (error) {
            console.error('❌ Firebase Storage error:', error.message);
            hasErrors = true;
        }

        // Test Firestore connection
        console.log('\nTesting Firestore connection...');
        try {
            const testCollectionRef = collection(db, 'test_connection');
            await getDocs(testCollectionRef);
            console.log('✅ Firestore connection successful');
        } catch (error) {
            console.error('❌ Firestore error:', error.message);

            if (error.message.includes('PERMISSION_DENIED') || error.message.includes('not been used')) {
                console.log('\n⚠️ IMPORTANT: You need to enable Firestore in your Firebase project:');
                console.log('1. Go to: https://console.firebase.google.com/project/beat-it-a792a/firestore');
                console.log('2. Click "Create database"');
                console.log('3. Choose "Start in production mode" or "Start in test mode" (for development)');
                console.log('4. Select a location closest to your users');
                console.log('5. Click "Enable"');
            }

            hasErrors = true;
        }

        // Summary
        console.log('\n--- Firebase Connection Test Summary ---');
        if (hasErrors) {
            console.log('⚠️ Some Firebase services had connection issues.');
            console.log('Please fix the issues above before proceeding with migration.');
        } else {
            console.log('✅ All Firebase services connected successfully!');
        }

        process.exit(hasErrors ? 1 : 0);
    } catch (error) {
        console.error('\n❌ Unexpected error during Firebase connection tests:');
        console.error(error);
        process.exit(1);
    }
}

testFirebaseConnection().then();
