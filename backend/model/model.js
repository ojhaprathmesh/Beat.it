let mongoose = require("mongoose")
const fs = require('fs')
let schema = new mongoose.Schema(
    {
        id:{type:Number, required:true, unique:true},
        title:{type:String, required:true},
        artist:[{type:String}],
        album:{type:String, required:true},
        genre:{type:String, required:true},
        file:{type:String, required:true},
        albumCover:{type:String, required:true}, 
        duration: {type:String, required:true}
        
    }
);

let SongsDB = new mongoose.model("SongsDB", schema)

 let songsDB1 = ()=>{
    
        let s1 = new SongsDB({
        "id": 1,
        "title": "Do Pal",
        "artist": ["Lata Mangeshkar", "Sonu Nigam", "Madan Mohan", "Javed Akhtar"],
        "album": "Veer-Zaara",
        "genre": "Bollywood",
        "file": "../do-pal.mp3",
        "albumCover": "/veer-zaara.webp",
        "duration": "4:25"
        });

        let s2 = new SongsDB({
            "id": 2,
            "title": "Main Yahaan Hoon",
            "artist": ["Sonu Nigam", "Madan Mohan", "Javed Akhtar"],
            "album": "Veer-Zaara",
            "genre": "Bollywood",
            "file": "../main-yahaan-hoon.mp3",
            "albumCover": "/veer-zaara.webp",
            "duration": "4:55"
        });

        let s3 = new SongsDB({
            "id": 3,
            "title": "Tere Liye",
            "artist": ["Lata Mangeshkar", "Roopkumar Rathod", "Salim-Sulaiman", "Javed Akhtar"],
            "album": "Veer-Zaara",
            "genre": "Bollywood",
            "file": "../tere-liye.mp3",
            "albumCover": "/veer-zaara.webp",
            "duration": "5:31"
        });

        let s4 = new SongsDB({
            "id": 4,
            "title": "Kabhi Kabhi Aditi",
            "artist": ["Rashid Ali"],
            "album": "Jaane Tu... Ya Jaane Na",
            "genre": "Bollywood",
            "file": "../kabhi-kabhi-aditi.mp3",
            "albumCover": "/kabhi-kabhi-aditi.webp",
            "duration": "3:38"
        });

        let s5 = new SongsDB({
            "id": 5,
            "title": "Nazrein Milana Nazrein Churana",
            "artist": ["Benny Dayal", "Satish Chakravarthy", "Sayonara"],
            "album": "Jaane Tu... Ya Jaane Na",
            "genre": "Bollywood",
            "file": "../nazrein-milaana-nazrein-churaana.mp3",
            "albumCover": "/kabhi-kabhi-aditi.webp",
            "duration": "3:53"
        });

        let s6 = new SongsDB({
            "id": 6,
            "title": "Pappu Can't Dance",
            "artist": ["Benny Dayal", "Naresh Iyer", "Satish Chakravarthy"],
            "album": "Jaane Tu... Ya Jaane Na",
            "genre": "Bollywood",
            "file": "../pappu-cant-dance.mp3",
            "albumCover": "/kabhi-kabhi-aditi.webp",
            "duration": "4:24"
        });

        let s7 = new SongsDB({
            "id": 7,
            "title": "Dil Dhadakne Do",
            "artist": ["Shankar-Ehsaan-Loy", "Suraj Jagan", "Shankar Mahadevan"],
            "album": "Zindagi Na Milegi Dobara",
            "genre": "Bollywood",
            "file": "../dil-dhadakne-do.mp3",
            "albumCover": "/sooraj-ki-baahon-mein.webp",
            "duration": "3:51"
        });

        let s8 = new SongsDB({
            "id": 8,
            "title": "Senorita",
            "artist": ["Shankar-Ehsaan-Loy", "Farhan Akhtar", "Hrithik Roshan"],
            "album": "Zindagi Na Milegi Dobara",
            "genre": "Bollywood",
            "file": "../senorita.mp3",
            "albumCover": "/sooraj-ki-baahon-mein.webp",
            "duration": "3:51"
        });

        let s9 = new SongsDB({
            "id": 9,
            "title": "Sooraj Ki Baahon Mein",
            "artist": ["Shankar-Ehsaan-Loy", "Clinton Cerejo", "Dominique Cerejo"],
            "album": "Zindagi Na Milegi Dobara",
            "genre": "Bollywood",
            "file": "../sooraj-ki-baahon-mein.mp3",
            "albumCover": "/sooraj-ki-baahon-mein.webp",
            "duration": "3:24"
        });

        let s10 = new SongsDB({
            "id": 10,
            "title": "Desi Kalakaar",
            "artist": ["Yo Yo Honey Singh"],
            "album": "Desi Kalakaar",
            "genre": "Bollywood",
            "file": "../desi-kalakaar.mp3",
            "albumCover": "/desi-kalakaar.webp",
            "duration": "4:18"
        });

        let s11 = new SongsDB({
            "id": 11,
            "title": "I'm Your DJ Tonight",
            "artist": ["Yo Yo Honey Singh"],
            "album": "Desi Kalakaar",
            "genre": "Bollywood",
            "file": "../im-your-dj-tonight.mp3",
            "albumCover": "/desi-kalakaar.webp",
            "duration": "4:41"
        });

        let s12 = new SongsDB({
            "id": 12,
            "title": "Love Dose",
            "artist": ["Yo Yo Honey Singh"],
            "album": "Desi Kalakaar",
            "genre": "Bollywood",
            "file": "../love-dose.mp3",
            "albumCover": "/desi-kalakaar.webp",
            "duration": "3:48"
        });

     SongsDB.insertMany([s1, s2, s3, s4, s5, s6, s7, s8, s9 , s10, s11, s12])
 }
 module.exports=songsDB1


//reading db



async function fetchJSON() {
    try {

        const results = await SongsDB.find().select({_id:0, __v:0});

        const filePath = 'database/data/songsData.json';
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8'); // `null, 2` for pretty printing
        console.log(`Data successfully saved to ${filePath}`);

        } 

    catch (error) {
        console.error("Error fetching or saving data:", error);
    }
}

module.exports=fetchJSON
