const {
  s3,
  PutObjectCommand,
  GetObjectCommand,
} = require("../configs/aws.config");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer"); // CJS
const cloudinary = require("../configs/cloudinary.config");
const crypto = require("crypto");

const urlImagePublic = "https://d2kf7ddfjt9vmk.cloudfront.net";

const randomImageName = () => crypto.randomBytes(16).toString("hex");

// upload File use s3Client

const uploadImageFromLocalS3 = async ({ file }) => {
  try {
    const imageName = randomImageName();
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      // Key: file.originalName || "unknown-file",
      Key: imageName,
      Body: file.buffer,
      ContentType: "image/jpeg",
    });

    const result = await s3.send(command);
    console.log(result);

    // const singeUrl = new GetObjectCommand({
    //   Bucket: process.env.AWS_BUCKET_NAME,
    //   Key: imageName,
    // });

    // export url
    // const url = await getSignedUrl(s3, singeUrl, { expiresIn: 3600 });

    //have cloudfont url export
    const url = await getSignedUrl({
      url: `${urlImagePublic}/${imageName}`,
      keyPairId: "K2OKNN9HTIQSNO",
      dateLessThan: new Date(Date.now() + 1000 * 60),
      privateKey: process.env.AWS_BUCKET_PRIVATE_KEY_ID,
    });

    return {
      url,
      result,
    };
    // return {
    //   image_url: result.secure_url,
    //   shopId: 8409,
    //   thumb_url: await cloudinary.url(result.public_id, {
    //     height: 100,
    //     width: 100,
    //     format: "jpg",
    //   }),
    // };
  } catch (error) {
    console.error("Error uploading image::", error);
  }
};

const uploadImageFromUrl = async () => {
  try {
    const urlImage =
      "https://down-vn.img.susercontent.com/file/10e0cd254c45240c46daf40695df6f33";
    const folderName = "product/shopId",
      newFileName = "testDemo";
    const result = await cloudinary.uploader.upload(urlImage, {
      public_id: newFileName,
      folder: folderName,
    });

    console.log(result);
    return result;
  } catch (error) {
    console.error("Error uploading image::", error);
  }
};
//2. upload image from local

const uploadImageFromLocal = async ({ path, folderName = "product/8409" }) => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      public_id: "thumb",
      folder: folderName,
    });

    console.log(result);
    return {
      image_url: result.secure_url,
      shopId: 8409,
      thumb_url: await cloudinary.url(result.public_id, {
        height: 100,
        width: 100,
        format: "jpg",
      }),
    };
  } catch (error) {
    console.error("Error uploading image::", error);
  }
};

//3. upload image from local

const uploadImageFromFiles = async ({ files, folderName = "product/8409" }) => {
  try {
    if (!files.length) return;

    const uploadedUrls = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folderName,
      });

      uploadedUrls.push({
        image_url: result.secure_url,
        shopId: 8409,
        thumb_url: await cloudinary.url(result.public_id, {
          height: 100,
          width: 100,
          format: "jpg",
        }),
      });
    }

    // console.log(result);
    return uploadedUrls;
  } catch (error) {
    console.error("Error uploading image::", error);
  }
};

module.exports = {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadImageFromFiles,
  uploadImageFromLocalS3,
};
