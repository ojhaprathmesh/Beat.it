const mongoose = require('mongoose');
const { migrateSongs, migrateSongFiles, exportSongsToJSON } = require('./songsService');
const path = require('path');
const fs = require('fs');

/**
 * Utility to migrate from MongoDB to Firebase
 */
const migrateFromMongoDB = async () => {
  try {
    console.log('Starting migration from MongoDB to Firebase...');
    
    // Option 1: If we can connect to MongoDB directly
    const mongoData = await fetchFromMongoDB();
    
    // Option 2: Or if we already have the data in a JSON file
    // const songsFilePath = path.join(__dirname, '../../frontend/public/data/songsData.json');
    // const mongoData = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));
    
    // Migrate songs data to Firestore
    await migrateSongs(mongoData);
    console.log('Song data migrated to Firestore');
    
    // Migrate song files to Firebase Storage
    await migrateSongFiles();
    console.log('Song files migrated to Firebase Storage');
    
    // Export updated data back to JSON for frontend use
    await exportSongsToJSON();
    console.log('Migration completed successfully');
    
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Fetch data directly from MongoDB (if accessible)
 */
const fetchFromMongoDB = async () => {
  try {
    // Get MongoDB connection details from environment variables
    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beat-it';
    
    // Connect to MongoDB
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB for migration');
    
    // Define a temporary schema that matches your songs collection
    const songSchema = new mongoose.Schema({
      id: Number,
      title: String,
      artist: [String],
      album: String,
      genre: String,
      file: String,
      albumCover: String,
      duration: String
    }, { collection: 'songsdbs' });
    
    const SongsDB = mongoose.model('SongsDB', songSchema);
    
    // Fetch all songs from MongoDB
    const songs = await SongsDB.find({}).lean();
    console.log(`Fetched ${songs.length} songs from MongoDB`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    return songs;
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    throw error;
  }
};

module.exports = { migrateFromMongoDB }; 