import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import uploadhandler from "../utils/cloudinary.js";
import { apiresponse } from "../utils/apiresponse.js";
import fs from "fs";

const registerUser = asyncHandler(async (req, res) => {
    
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverImagepath = req.files?.coverImage?.[0]?.path;
  try {
    const { fullName, email, username, password } = req.body;

    if (
      [fullName, email, password, username].some((field) => field.trim() === "")
    ) {
      throw new apierror(400, "Incorrect Info Provided");
    }

    const userexisted = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userexisted) {
      throw new apierror(400, "User Already Existed");
    }

    if (!avatarlocalpath) {
      throw new apierror(400, "Avatar Not uploaded");
    }

    const avatar = await uploadhandler(avatarlocalpath);
    let coverImage;
    if (coverImagepath) {
      coverImage = await uploadhandler(coverImagepath);
    }

    if (!avatar) {
      throw new apierror(500, "Avatar cant be uploaded to Cloudinary");
    }

    const user = await User.create({
      fullName,
      email,
      username: username.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
    });

    const createduser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!createduser) {
      throw new apierror(500, "Server side error in registering user");
    }

    return res
      .status(200)
      .json(new apiresponse(200, "USER CREATED", createduser));
  } catch (error) {
    if (avatarlocalpath) { 
        await fs.promises.unlink(avatarlocalpath).catch(() => {});
    }
    if (coverImagepath) {
       await fs.promises.unlink(coverImagepath).catch(() => {});

    }

    throw error;
  }
});

export { registerUser };
