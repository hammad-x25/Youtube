import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { apierror } from "./apierror.js";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadhandler = async (localpath, { resourceType = "auto" } = {}) => {
  if (!localpath) return null;
  try {
    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: resourceType,
    });
    await fs.promises.unlink(localpath).catch(() => {});
    return response;
  } catch (error) {
    await fs.promises.unlink(localpath).catch(() => {});
    console.error("Cloudinary upload failed:", {
      code: error.http_code || error.code || "UNKNOWN",
      message: error.message,
    });
    throw new apierror(
      503,
      "Cloudinary upload failed. Check the server configuration and file format.",
      [{ code: error.http_code || error.code || "CLOUDINARY_UPLOAD_FAILED" }],
    );
  }
};

const deleteFromCloudinary = async (public_id, resourceType = "image") => {
  try {
    if (!public_id) return null;
    const res = await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType, 
    });
   
    return res;
  } catch (error) {
    return null;
  }
};

export { uploadhandler, deleteFromCloudinary };
