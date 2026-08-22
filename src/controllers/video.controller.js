import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { deleteFromCloudinary, uploadhandler } from "../utils/cloudinary.js";
import { apiresponse } from "../utils/apiresponse.js";
import fs from "fs";
import { getPublicIdFromUrl } from "../utils/getidfromurl.js";
import mongoose from "mongoose";

const uploadvideo = asyncHandler(async (req, res) => {
  let thumbnailPath = req.files?.Thumbnail?.[0]?.path;
  let videoPath = req.files?.VideoFile?.[0]?.path;

  try {
    const { title, description, isPublished } = req.body;

    let finalIsPublished = true; // default when not provided

    if (isPublished !== undefined) {
      if (isPublished !== "true" && isPublished !== "false") {
        throw new apierror(400, "wrong IsPublished Status");
      }
      finalIsPublished = isPublished === "true";
    }

    if (!title?.trim() || !description?.trim()) {
      throw new apierror(400, "Title and description are required");
    }

    if (!thumbnailPath || !videoPath) {
      throw new apierror(400, "Video and thumbnail are required");
    }

    const video = await uploadhandler(videoPath);

    if (!video) {
      throw new apierror(503, "Failed to upload video");
    }

    const thumbnail = await uploadhandler(thumbnailPath);

    if (!thumbnail) {
      const publicId = getPublicIdFromUrl(video.url);

      await deleteFromCloudinary(publicId, "Video");

      throw new apierror(503, "Failed to upload thumbnail");
    }

    const videoDB = await Video.create({
      title: title.trim(),
      description: description.trim(),

      owner: req.user._id,

      VideoFile: video.url,
      Thumbnail: thumbnail.url,

      views: 0,
      duration: video.duration,

      isPublished: finalIsPublished,
    });

    return res
      .status(201)
      .json(new apiresponse(201, "Video created successfully", videoDB));
  } catch (error) {
    if (videoPath) {
      await fs.promises.unlink(videoPath).catch(() => {});
    }

    if (thumbnailPath) {
      await fs.promises.unlink(thumbnailPath).catch(() => {});
    }
    throw error;
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }

  const video = await Video.findOneAndUpdate(
    {
      _id: videoId,
      isPublished: true,
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    },
  ).populate("owner", "username fullName avatar");

  if (!video) {
    throw new apierror(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiresponse(200, "Video successfully retrieved", video));
});

const getAllVideos = asyncHandler(async (req, res) => {
  let page = Number(req.query.page) || 1;
  let limit = Number(req.query.limit) || 10;

  if (page < 1) {
    throw new apierror(400, "Page must be greater than 0");
  }

  if (limit < 1 || limit > 50) {
    throw new apierror(400, "Limit must be between 1 and 50");
  }

  const skip = (page - 1) * limit;

  const videos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },

    {
      $sort: {
        createdAt: -1,
        _id: -1,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },

    {
      $project: {
        title: 1,
        description: 1,
        VideoFile: 1,
        Thumbnail: 1,
        views: 1,
        duration: 1,
        createdAt: 1,
        isPublished: 1,

        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    },

    {
      $project: {
        title: 1,
        description: 1,
        VideoFile: 1,
        Thumbnail: 1,
        views: 1,
        duration: 1,
        createdAt: 1,
        isPublished: 1,

        "owner._id": 1,
        "owner.username": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiresponse(
        200,
        videos.length ? "Videos retrieved successfully" : "No videos found",
        videos,
      ),
    );
});

const updateVideo = asyncHandler(async (req, res) => {

    let thumbnailPath = req.files?.Thumbnail?.[0]?.path;
    let newThumbnail = null;

    try {
        const { videoId } = req.params;
        const { title, description } = req.body;

        if (!mongoose.isValidObjectId(videoId)) {
            throw new apierror(400, "Invalid video ID");
        }

        if (
            title === undefined &&
            description === undefined &&
            !thumbnailPath
        ) {
            throw new apierror(
                400,
                "No fields provided for update"
            );
        }

        if (
            title !== undefined &&
            title.trim() === ""
        ) {
            throw new apierror(
                400,
                "Title cannot be empty"
            );
        }

        if (
            description !== undefined &&
            description.trim() === ""
        ) {
            throw new apierror(
                400,
                "Description cannot be empty"
            );
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new apierror(
                404,
                "Video not found"
            );
        }

        if (
            video.owner.toString() !==
            req.user._id.toString()
        ) {
            throw new apierror(
                403,
                "You are not allowed to update this video"
            );
        }

        const updateData = {};

        if (title !== undefined) {
            updateData.title = title.trim();
        }

        if (description !== undefined) {
            updateData.description = description.trim();
        }

       
        if (thumbnailPath) {

            newThumbnail = await uploadhandler(
                thumbnailPath
            );

            if (!newThumbnail) {
                throw new apierror(
                    500,
                    "Thumbnail upload failed"
                );
            }

            updateData.Thumbnail = newThumbnail.url;
        }

        
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: updateData
            },
            {
                new: true,
                runValidators: true
            }
        );

       
        if (!updatedVideo) {

            
            if (newThumbnail?.url) {
                const newPublicId =
                    getPublicIdFromUrl(newThumbnail.url);

                await deleteFromCloudinary(
                    newPublicId,
                    "Image"
                ).catch(() => {});
            }

            throw new apierror(
                500,
                "Video could not be updated"
            );
        }

        
        if (newThumbnail) {

            const oldPublicId =
                getPublicIdFromUrl(video.Thumbnail);

            await deleteFromCloudinary(
                oldPublicId,
                "Image"
            ).catch(() => {});
        }

        
        return res
            .status(200)
            .json(
                new apiresponse(
                    200,
                    "Video updated successfully",
                    updatedVideo
                )
            );

    } catch (error) {

        
        if (thumbnailPath) {
            await fs.promises
                .unlink(thumbnailPath)
                .catch(() => {});
        }

        throw error;
    }
});

export { uploadvideo, getVideoById, getAllVideos, updateVideo };
