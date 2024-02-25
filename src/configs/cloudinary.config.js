// Require the cloudinary library
const cloudinary = require("cloudinary").v2;

// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: "shopdev1",
  api_key: "722497887873691",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log the configuration
// console.log(cloudinary.config());

module.exports = cloudinary;
