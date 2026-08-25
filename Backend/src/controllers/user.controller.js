import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { uploadhandler, deleteFromCloudinary } from "../utils/cloudinary.js";
import { apiresponse } from "../utils/apiresponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Likes } from "../models/like.models.js";

const generateAccessandrefreshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apierror(500, "error while genrating tokens", error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const avatarlocalpath = req.files?.avatar?.[0]?.path;
  const coverImagepath = req.files?.coverImage?.[0]?.path;
  let avatar;
  let coverImage;
  try {
    const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : req.body.fullName;
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : req.body.email;
    const username = typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : req.body.username;
    const { password } = req.body;

    if (
      [fullName, email, password, username].some(
        (field) => typeof field !== "string" || field.trim() === "",
      )
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

    avatar = await uploadhandler(avatarlocalpath, { resourceType: "image" });

    if (!avatar) {
      throw new apierror(503, "Avatar upload did not return a Cloudinary asset");
    }

    if (coverImagepath) {
      try {
        coverImage = await uploadhandler(coverImagepath, { resourceType: "image" });
      } catch (error) {
        if (avatar.public_id) {
          await deleteFromCloudinary(avatar.public_id, "image");
        }
        throw error;
      }
    }

    let user;
    try {
      user = await User.create({
      fullName,
      email,
      username,
      avatar: avatar.secure_url || avatar.url,
      coverImage: coverImage?.secure_url || coverImage?.url || "",
      password,
      });
    } catch (error) {
      if (coverImage?.public_id) await deleteFromCloudinary(coverImage.public_id, "image");
      if (avatar?.public_id) await deleteFromCloudinary(avatar.public_id, "image");
      throw error;
    }

    const createduser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!createduser) {
      if (user?._id) await User.findByIdAndDelete(user._id);
      if (coverImage?.public_id) await deleteFromCloudinary(coverImage.public_id, "image");
      if (avatar?.public_id) await deleteFromCloudinary(avatar.public_id, "image");
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

    //we do this because there may be the path not existed so in that case it still catches
    // the original error not while removing when also unlinksync also pause nodejs while fs.promises
    //is asynchronous
    throw error;
  }
});

const loginuser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new apierror(400, "Mising Credentials");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apierror(400, "User not found");
  }

  if (!password || !(await user.isPasswordCorrect(password))) {
    throw new apierror(400, "Username or Password Wrong");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };

  const { accessToken, refreshToken } =
    await generateAccessandrefreshToken(user);

  const safeUser = await User.findById(user._id).select("-password -refreshToken -WatchHistory");

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiresponse(200, "User Logged In", {
        safeUser,
      }),
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  const user = req.user;
  user.refreshToken = "";
  await user.save({ validateBeforeSave: false });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiresponse(200, "Log out user", {}));
});

const refreshaccesstoken = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) throw new apierror(400, "No refresh token provided");

  const decodedToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decodedToken._id).select("-password -refreshToken -WatchHistory");
  if (!user) throw new apierror(400, "Refresh Token INvalid or expired");

  if (refreshToken != user.refreshToken)
    throw new apierror(400, "Refresh Token INvalid or expired");
  const accessToken = await user.generateAccessToken();
  const newrefresh=await user.generateRefreshToken();
  user.refreshToken=newrefresh;
  await user.save();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefresh, options)
    .json(
      new apiresponse(200, "AccessToken Refreshed", {
      }),
    );
});

const updatepassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id)

  const isCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isCorrect) throw new apierror(400, "Old password is incorrect");

  user.password = newPassword;

  await user.save();

  const safeUser = await User.findById(user._id)
    .select("-password -refreshToken");

  return res
    .status(200)
    .json(new apiresponse(200, "Password Updated", { safeUser }));
});

const updateprofile = asyncHandler(async (req, res) => {
  const { username, fullName } = req.body;

  if (!username || !fullName)
    throw new apierror(400, "Username or fullname not provided");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { fullName, username },
    },
    {
      returnDocument: "after",
    },
  ).select("-password -refreshToken -WatchHistory");

  return res
    .status(200)
    .json(new apiresponse(200, "Profile Updated", { user }));
});

const getcurrentuser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiresponse(200, "Current user returned", req.user));
});



const getuseraccountdetails = asyncHandler(async (req, res) => {
  const {username}=req.params; 
   // because we will do /api/user/accountdetails/:username so we can get the username from params
  if(!username?.trim()) throw new apierror(400,"Username not provided");

  const currentUserId = req.user?._id || null;
  const channel=await User.aggregate([
    {
      $match: { username: username.toLowerCase() },
    }, 
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    }
    ,{
      $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedchannels"
      } 
    },
    {
      $addFields:{
        subscriberscount:{$size:"$subscribers"},
        subscribedchannelscount:{$size:"$subscribedchannels"}
      }
    },
    {
      $addFields:{
        issubscribed:{
          $cond:{
            if:{$in:[currentUserId,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        _id: 1,
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberscount: 1,
        subscribedchannelscount: 1,
        issubscribed: 1,
      }
    }

  ])

  if (!channel?.length) {
    throw new apierror(404, "Channel not found");
}
  return res.status(200).json(new apiresponse(200, "Channel details retrieved", channel[0]));
});

const getwatchhistory=asyncHandler(async(req,res)=>
{
  const watchhistory=await User.aggregate(
    [
      {
        $match:{
          _id:new mongoose.Types.ObjectId(req.user._id)
        }

      },
      {
        $lookup:{
          from:"videos",
          localField:"watchHistory",
          foreignField:"_id",
          as:"WatchedVideos",
          pipeline:[
            {
              $lookup:{
                from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"WatchedVideo_Creator",
              pipeline:[
                {
                  $project:
                  {
                    username:1,
                    avatar:1,
                    fullName:1
                  }
                }
              ]
            }}
            ,{
              $addFields: {
                owner: {
                  $first:"$WatchedVideo_Creator"
                }
              }
            }
          ]
        }
      }
    ]
  )

  return res.status(200)
  .json(new apiresponse(200,"Watch History Retrieved",watchhistory[0]?.WatchedVideos||[]))
});

const getLikedVideos = asyncHandler(async (req, res) => {

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const page = Math.max(
        Number.parseInt(req.query.page, 10) || 1,
        1
    );

    const limit = Math.min(
        Math.max(
            Number.parseInt(req.query.limit, 10) || 20,
            1
        ),
        50
    );

    const skip = (page - 1) * limit;

    
    const likedVideos = await Likes.aggregate([

        {
            $match: {
                Likedby: userId,
                Video: {
                    $exists: true,
                    $ne: null
                }
            }
        },
        {
            $lookup: {
                from: "videos",

                localField: "Video",
                foreignField: "_id",

                as: "video"
            }
        },

        {
            $unwind: "$video"
        },
  
        {
            $match: {
                "video.isPublished": true
            }
        },
         {
            $sort: {
                createdAt: -1,
                _id: -1
            }
        },

        {
            $skip: skip
        },

        {
            $limit: limit
        },

        {
            $lookup: {
                from: "users",

                localField: "video.owner",
                foreignField: "_id",

                as: "owner"
            }
        },

        {
            $unwind: "$owner"
        },

        {
            $project: {
                _id: "$video._id",
                title: "$video.title",
                Thumbnail: "$video.Thumbnail",
                duration: "$video.duration",
                views: "$video.views",
                createdAt: "$video.createdAt",

                likedAt: "$createdAt",

                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Liked videos retrieved successfully",
                {
                    page,
                    limit,
                    videos: likedVideos
                }
            )
        );
});


export {
  registerUser,
  loginuser,
  logoutuser,
  refreshaccesstoken,
  updatepassword,
  updateprofile,
  getcurrentuser,
  getuseraccountdetails,
  getwatchhistory,
  getLikedVideos
};
