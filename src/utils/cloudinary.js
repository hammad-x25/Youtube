import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadhandler = async (localpath) => {
  if (!localpath) return null;
  try {
    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto",
    });
    console.log("Image uploaded", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localpath);
    return null;
  }
};

export default uploadhandler;
