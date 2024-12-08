require('dotenv').config();
const mongoose = require("mongoose");

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_NAME;

const constring = `mongodb+srv://${dbUser}:${dbPassword}@${dbHost}/${dbName}?retryWrites=true&w=majority&appName=Site-Database`;

let dbconnect = async () => {
    try {
        await mongoose.connect(constring, {});
        console.log("Database successfully connected!");
    } catch (err) {
        console.log("error: " + err);
    }
}

module.exports = dbconnect;
