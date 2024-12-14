require('dotenv').config();
const mongoose = require("mongoose");

const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;

const dbURI = `mongodb+srv://${dbUser}:${dbPass}@${dbHost}/${dbName}?retryWrites=true&w=majority&appName=Site-Database`;

let dbconnect = async () => {
    try {
        await mongoose.connect(dbURI, {});
    } catch (err) {
        console.log("error: " + err);
    }
}

module.exports = dbconnect;
