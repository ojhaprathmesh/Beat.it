const mongoose = require("mongoose");
const fs = require('fs');
const path = require("path");

const schema = new mongoose.Schema({
    id: {type: Number, required: true, unique: true},
    title: {type: String, required: true},
    artist: [{type: String}],
    album: {type: String, required: true},
    genre: {type: String, required: true},
    file: {type: String, required: true},
    albumCover: {type: String, required: true},
    duration: {type: String, required: true}
});

const songsDB = new mongoose.model("SongsDB", schema);

const createDB = async () => {
    const s1 = new songsDB({
        "id": 1,
        "title": "Do Pal",
        "artist": ["Lata Mangeshkar", "Sonu Nigam", "Madan Mohan", "Javed Akhtar"],
        "album": "Veer-Zaara",
        "genre": "Bollywood",
        "file": "uploads/do-pal.mp3",
        "albumCover": "assets/album-covers/veer-zaara.webp",
        "duration": "4:25"
    });

    const s2 = new songsDB({
        "id": 2,
        "title": "Main Yahaan Hoon",
        "artist": ["Sonu Nigam", "Madan Mohan", "Javed Akhtar"],
        "album": "Veer-Zaara",
        "genre": "Bollywood",
        "file": "uploads/main-yahaan-hoon.mp3",
        "albumCover": "assets/album-covers/veer-zaara.webp",
        "duration": "4:55"
    });

    const s3 = new songsDB({
        "id": 3,
        "title": "Tere Liye",
        "artist": ["Lata Mangeshkar", "Roopkumar Rathod", "Salim-Sulaiman", "Javed Akhtar"],
        "album": "Veer-Zaara",
        "genre": "Bollywood",
        "file": "uploads/tere-liye.mp3",
        "albumCover": "assets/album-covers/veer-zaara.webp",
        "duration": "5:31"
    });

    const s4 = new songsDB({
        "id": 4,
        "title": "Kabhi Kabhi Aditi",
        "artist": ["Rashid Ali"],
        "album": "Jaane Tu... Ya Jaane Na",
        "genre": "Bollywood",
        "file": "uploads/kabhi-kabhi-aditi.mp3",
        "albumCover": "assets/album-covers/kabhi-kabhi-aditi.webp",
        "duration": "3:38"
    });

    const s5 = new songsDB({
        "id": 5,
        "title": "Nazrein Milana Nazrein Churana",
        "artist": ["Benny Dayal", "Satish Chakravarthy", "Sayonara"],
        "album": "Jaane Tu... Ya Jaane Na",
        "genre": "Bollywood",
        "file": "uploads/nazrein-milaana-nazrein-churaana.mp3",
        "albumCover": "assets/album-covers/kabhi-kabhi-aditi.webp",
        "duration": "3:53"
    });

    const s6 = new songsDB({
        "id": 6,
        "title": "Pappu Can't Dance",
        "artist": ["Benny Dayal", "Naresh Iyer", "Satish Chakravarthy"],
        "album": "Jaane Tu... Ya Jaane Na",
        "genre": "Bollywood",
        "file": "uploads/pappu-cant-dance.mp3",
        "albumCover": "assets/album-covers/kabhi-kabhi-aditi.webp",
        "duration": "4:24"
    });

    const s7 = new songsDB({
        "id": 7,
        "title": "Dil Dhadakne Do",
        "artist": ["Shankar-Ehsaan-Loy", "Suraj Jagan", "Shankar Mahadevan"],
        "album": "Zindagi Na Milegi Dobara",
        "genre": "Bollywood",
        "file": "uploads/dil-dhadakne-do.mp3",
        "albumCover": "assets/album-covers/sooraj-ki-baahon-mein.webp",
        "duration": "3:51"
    });

    const s8 = new songsDB({
        "id": 8,
        "title": "Senorita",
        "artist": ["Shankar-Ehsaan-Loy", "Farhan Akhtar", "Hrithik Roshan"],
        "album": "Zindagi Na Milegi Dobara",
        "genre": "Bollywood",
        "file": "uploads/senorita.mp3",
        "albumCover": "assets/album-covers/sooraj-ki-baahon-mein.webp",
        "duration": "3:51"
    });

    const s9 = new songsDB({
        "id": 9,
        "title": "Sooraj Ki Baahon Mein",
        "artist": ["Shankar-Ehsaan-Loy", "Clinton Cerejo", "Dominique Cerejo"],
        "album": "Zindagi Na Milegi Dobara",
        "genre": "Bollywood",
        "file": "uploads/sooraj-ki-baahon-mein.mp3",
        "albumCover": "assets/album-covers/sooraj-ki-baahon-mein.webp",
        "duration": "3:24"
    });

    const s10 = new songsDB({
        "id": 10,
        "title": "Desi Kalakaar",
        "artist": ["Yo Yo Honey Singh"],
        "album": "Desi Kalakaar",
        "genre": "Bollywood",
        "file": "uploads/desi-kalakaar.mp3",
        "albumCover": "assets/album-covers/desi-kalakaar.webp",
        "duration": "4:18"
    });

    const s11 = new songsDB({
        "id": 11,
        "title": "I'm Your DJ Tonight",
        "artist": ["Yo Yo Honey Singh"],
        "album": "Desi Kalakaar",
        "genre": "Bollywood",
        "file": "uploads/im-your-dj-tonight.mp3",
        "albumCover": "assets/album-covers/desi-kalakaar.webp",
        "duration": "4:41"
    });

    const s12 = new songsDB({
        "id": 12,
        "title": "Love Dose",
        "artist": ["Yo Yo Honey Singh"],
        "album": "Desi Kalakaar",
        "genre": "Bollywood",
        "file": "uploads/love-dose.mp3",
        "albumCover": "assets/album-covers/desi-kalakaar.webp",
        "duration": "3:48"
    });

    const s13 = new songsDB({
        "id": 13,
        "title": "Bhool Bhulaiyaa",
        "artist": ["Pritam", "Niraj Shridhar"],
        "album": "Bhool Bhulaiyaa",
        "genre": "Bollywood",
        "file": "uploads/bhool-bhulaiyaa.mp3",
        "albumCover": "assets/album-covers/bhool-bhulaiyaa.webp",
        "duration": "5:27"
    });

    const s14 = new songsDB({
        "id": 14,
        "title": "Labon Ko",
        "artist": ["Pritam", "KK"],
        "album": "Bhool Bhulaiyaa",
        "genre": "Bollywood",
        "file": "uploads/labon-ko-bhool-bhulaiyaa.mp3",
        "albumCover": "assets/album-covers/bhool-bhulaiyaa.webp",
        "duration": "5:43"
    });

    const s15 = new songsDB({
        "id": 15,
        "title": "Mere Dholna",
        "artist": ["Pritam", "Shreya Ghoshal", "M. G.Shreekumar"],
        "album": "Bhool Bhulaiyaa",
        "genre": "Bollywood",
        "file": "uploads/mere-dholna-bhool-bhulaiyaa.mp3",
        "albumCover": "assets/album-covers/bhool-bhulaiyaa.webp",
        "duration": "6:47"
    });

    const s16 = new songsDB({
        "id": 16,
        "title": "Daaru Desi",
        "artist": ["Pritam", "Benny Dayal", "Shalmali Kholgade"],
        "album": "Cocktail",
        "genre": "Bollywood",
        "file": "uploads/daaru-desi.mp3",
        "albumCover": "assets/album-covers/cocktail.webp",
        "duration": "4:29"
    });

    const s17 = new songsDB({
        "id": 17,
        "title": "Second Hand Jawaani",
        "artist": ["Pritam", "Miss Pooja", "Neha Kakkar", "Nakkash Aziz"],
        "album": "Cocktail",
        "genre": "Bollywood",
        "file": "uploads/second-hand-jawaani.mp3",
        "albumCover": "assets/album-covers/cocktail.webp",
        "duration": "4:02"
    });

    const s18 = new songsDB({
        "id": 18,
        "title": "Tera Naam Japdi Phiran",
        "artist": ["Pritam", "Nikhil D'souza", "Shefali Alvares", "Javed Bashir"],
        "album": "Cocktail",
        "genre": "Bollywood",
        "file": "uploads/tera-naam-japdi-phiran.mp3",
        "albumCover": "assets/album-covers/cocktail.webp",
        "duration": "3:39"
    });

    return songsDB.insertMany([s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18])
        .catch((err) => {
            console.error(`Error during insert: ${err.name}`);
            throw err; // Re-throw to propagate the error if needed
        });
}

const fetchJSON = async () => {
    try {
        const results = await songsDB.find().select({_id: 0, __v: 0});
        const filePath = path.join(__dirname, "../../frontend/public/data/songsData.json");

        fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8'); // `null, 2` for pretty printing
        return filePath
    } catch (error) {
        console.error("Error fetching or saving data:", error);
    }
}

module.exports = {createDB, fetchJSON};