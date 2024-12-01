const mongoose = require("mongoose");
const fs = require('fs')


const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const UserData = mongoose.model("UserData", userSchema);

module.exports = UserData;