let mongoose = require("mongoose");
let constring = "mongodb+srv://shashwatgaur:fDJMzGsAJSnIpKay@cluster0.6222w.mongodb.net/";

let dbconnect = async () => {
    try {
        await mongoose.connect(constring, {});
        console.log("Database successfully connected!");
    } catch (err) {
        console.log("error: " + err);
    }
}

module.exports = dbconnect;