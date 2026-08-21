import {apierror} from "../utils/apierror.js";
import {asyncHandler} from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import { getPublicIdFromUrl } from "../utils/getidfromurl.js";
import { apiresponse } from "../utils/apiresponse.js";
import fs from "fs";
import { uploadhandler, deleteFromCloudinary } from "../utils/cloudinary.js";

const updateavatar = asyncHandler(async (req, res) => {
  const avatarlocalpath = req.file?.path;
  try {
    if (!avatarlocalpath) {
      throw new apierror(400, "Avatar Not uploaded");
    }

    const avatar = await uploadhandler(avatarlocalpath);

    if (!avatar) throw new apierror(400, "Avatar Not uploaded to cloudinary");

    const user=await User.findById(req.user._id).select("-password -refreshToken");
    if (!user) {
            throw new apierror(404, "User not found");
        }
    let oldAvatarPublicId=null;
    if(user.avatar){   
         oldAvatarPublicId = getPublicIdFromUrl(user.avatar);
     }
    
    
    user.avatar = avatar.url;
    await user.save({ validateBeforeSave: false });

    if (oldAvatarPublicId) {
      await deleteFromCloudinary(oldAvatarPublicId, "image");
    }

    return res
      .status(200)
      .json(new apiresponse(200, "Avatar photo Updated", user));
  } catch (error) {
    if (avatarlocalpath) {
      await fs.promises.unlink(avatarlocalpath).catch(() => {});
    }
    throw error;
  }
});

const updatecover = asyncHandler(async (req, res) => {
  const coverlocalpath = req.file?.path;
  try {
    if (!coverlocalpath) {
      throw new apierror(400, "cover Not uploaded");
    }

    const cover = await uploadhandler(coverlocalpath);

    if (!cover) throw new apierror(400, "cover Not uploaded to cloudinary");

    const user=await User.findById(req.user._id).select("-password -refreshToken");
    if (!user) {
            throw new apierror(404, "User not found");
        }
        let oldcoverPublicId=null;
    if(user.coverImage){   
         oldcoverPublicId = getPublicIdFromUrl(user.coverImage);
     }
    
    user.coverImage = cover.url;
    await user.save({ validateBeforeSave: false });

    if(oldcoverPublicId){
      await deleteFromCloudinary(oldcoverPublicId, "image");
    }

    return res
      .status(200)
      .json(new apiresponse(200, "Cover photo Updated", user));
  } catch (error) {
    if (coverlocalpath) {
      
      await fs.promises.unlink(coverlocalpath).catch(() => {});
    }
    throw error;
  }
});


export { updateavatar, updatecover };