const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

async function uploadMusicFile() {
  try {
    const filePath = path.join(__dirname, "assets", "mysong.mp3"); // adjust path and file name
    const fileStream = fs.createReadStream(filePath);

    const { url } = await put("songs/mysong.mp3", fileStream, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("Uploaded file URL:", url);
  } catch (error) {
    console.error("Error uploading music file to Vercel Blob:", error);
  }
}

uploadMusicFile();
