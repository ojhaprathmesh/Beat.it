const { db } = require('../config/firebase-config');
const { collection, addDoc, query, where, getDocs } = require('firebase/firestore');

const userModel = {
    async createUser(userData) {
        try {
            const userRef = await addDoc(collection(db, 'users'), userData);
            return userRef.id;
        } catch (error) {
            throw error;
        }
    },

    async findUserByEmail(email) {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            const userData = querySnapshot.docs[0].data();
            return { id: querySnapshot.docs[0].id, ...userData };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = userModel;