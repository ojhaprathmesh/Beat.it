let mongoose = require("mongoose")
let schema = new mongoose.Schema(
    {
        id:{type:Number, required:true},
        title:{type:String, required:true},
        artist:{type:String, required:true},
        album:{type:String, required:true},
        genre:{type:String, required:true},
        file:{type:String, required:true},
        albumCover:{type:String, required:true}
        
    }
);

let SongsDB = new mongoose.model("SongsDB", schema)

let songsDB1 = ()=>{
    let s1 = new  SongsDB({
        "id": 1,
        "title": "Do Pal",
        "artist": "Javed Akhtar",
        "album": "Veer-Zaara",
        "genre": "Bollywood",
        "file": "../do-pal.mp3",
        "albumCover": "/veer-zaara.webp"
    })
    s1.save()
}
module.exports=songsDB1