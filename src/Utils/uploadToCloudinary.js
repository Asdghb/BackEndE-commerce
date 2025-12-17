// const cloudinary = require("./cloudinary");

// const uploadToCloudinary = (buffer, folder) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_stream(
//       { folder },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     ).end(buffer);
//   });
// };

// module.exports = uploadToCloudinary;

const cloudinary = require("./cloudinary");

const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, ...options }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
};

module.exports = uploadToCloudinary;
