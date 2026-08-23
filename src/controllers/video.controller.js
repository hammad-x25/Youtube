import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { Playlist } from "../models/playlist.models.js";
import { Comments } from "../models/comment.models.js";
import { Likes } from "../models/like.models.js";

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

    if (title === undefined && description === undefined && !thumbnailPath) {
      throw new apierror(400, "No fields provided for update");
    }

    if (title !== undefined && title.trim() === "") {
      throw new apierror(400, "Title cannot be empty");
    }

    if (description !== undefined && description.trim() === "") {
      throw new apierror(400, "Description cannot be empty");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new apierror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
      throw new apierror(403, "You are not allowed to update this video");
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (thumbnailPath) {
      newThumbnail = await uploadhandler(thumbnailPath);

      if (!newThumbnail) {
        throw new apierror(500, "Thumbnail upload failed");
      }

      updateData.Thumbnail = newThumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedVideo) {
      if (newThumbnail?.url) {
        const newPublicId = getPublicIdFromUrl(newThumbnail.url);

        await deleteFromCloudinary(newPublicId, "Image").catch(() => {});
      }

      throw new apierror(500, "Video could not be updated");
    }

    if (newThumbnail) {
      const oldPublicId = getPublicIdFromUrl(video.Thumbnail);

      await deleteFromCloudinary(oldPublicId, "Image").catch(() => {});
    }

    return res
      .status(200)
      .json(new apiresponse(200, "Video updated successfully", updatedVideo));
  } catch (error) {
    if (thumbnailPath) {
      await fs.promises.unlink(thumbnailPath).catch(() => {});
    }

    throw error;
  }
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apierror(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new apierror(403, "You are not allowed to delete this video");
  }

  const videoPublicId = getPublicIdFromUrl(video.VideoFile);
  const thumbnailPublicId = getPublicIdFromUrl(video.Thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new apierror(500, "Video could not be deleted");
  }

  const comments = await Comments.find({
    Videos: videoId,
  }).select("_id");

  const commentIds = comments.map((comment) => comment._id);

  if (commentIds.length > 0) {
    await Likes.deleteMany({
      comment: { $in: commentIds },
    });
  }

  await Likes.deleteMany({
    Video: videoId,
  });

  await Comments.deleteMany({
    Videos: videoId,
  });

  await Playlist.updateMany(
    { Videos: videoId },
    { $pull: { Videos: videoId } },
  );
  await User.updateMany(
    { WatchHistory: videoId },
    { $pull: { WatchHistory: videoId } },
  );
  await deleteFromCloudinary(videoPublicId, "Video").catch((error) => {
    console.error("Failed to delete video from Cloudinary:", error);
  });

  await deleteFromCloudinary(thumbnailPublicId, "Image").catch((error) => {
    console.error("Failed to delete thumbnail from Cloudinary:", error);
  });
  return res
    .status(200)
    .json(new apiresponse(200, "Video deleted successfully", deletedVideo));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apierror(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new apierror(
      403,
      "You are not allowed to change this video publish status",
    );
  }
  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(
      new apiresponse(
        200,
        video.isPublished
          ? "Video published successfully"
          : "Video unpublished successfully",
        video,
      ),
    );
});

const getWatchVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }

  const videoObjectId = new mongoose.Types.ObjectId(videoId);
  const userObjectId = new mongoose.Types.ObjectId(req.user._id);

  const result = await Video.aggregate([
    {
      $match: {
        _id: videoObjectId,
        isPublished: true,
      },
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
      $unwind: "$owner",
    },

    {
      $lookup: {
        from: "likes",

        let: {
          videoId: "$_id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$Video", "$$videoId"],
              },
            },
          },

          {
            $count: "count",
          },
        ],

        as: "likeStats",
      },
    },

    {
      $lookup: {
        from: "likes",

        let: {
          videoId: "$_id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$Video", "$$videoId"],
                  },

                  {
                    $eq: ["$Likedby", userObjectId],
                  },
                ],
              },
            },
          },

          {
            $limit: 1,
          },
        ],

        as: "currentUserLike",
      },
    },

    {
      $lookup: {
        from: "subscriptions",

        let: {
          channelId: "$owner._id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$channel", "$$channelId"],
              },
            },
          },

          {
            $count: "count",
          },
        ],

        as: "subscriberStats",
      },
    },

    {
      $lookup: {
        from: "subscriptions",

        let: {
          channelId: "$owner._id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$channel", "$$channelId"],
                  },

                  {
                    $eq: ["$subscriber", userObjectId],
                  },
                ],
              },
            },
          },

          {
            $limit: 1,
          },
        ],

        as: "currentUserSubscription",
      },
    },
    {
      $lookup: {
        from: "comments",

        let: {
          videoId: "$_id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$Videos", "$$videoId"],
              },
            },
          },

          {
            $count: "count",
          },
        ],

        as: "commentStats",
      },
    },

    {
      $project: {
        _id: 1,
        VideoFile: 1,
        Thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,

        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },

        likeCount: {
          $ifNull: [
            {
              $arrayElemAt: ["$likeStats.count", 0],
            },
            0,
          ],
        },

        liked: {
          $gt: [
            {
              $size: "$currentUserLike",
            },
            0,
          ],
        },

        subscribersCount: {
          $ifNull: [
            {
              $arrayElemAt: ["$subscriberStats.count", 0],
            },
            0,
          ],
        },

        subscribed: {
          $gt: [
            {
              $size: "$currentUserSubscription",
            },
            0,
          ],
        },
        commentsCount: {
          $ifNull: [
            {
              $arrayElemAt: ["$commentStats.count", 0],
            },
            0,
          ],
        },
      },
    },
  ]);

  if (result.length === 0) {
    throw new apierror(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiresponse(200, "Watch data retrieved successfully", result[0]));
});

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new apierror(400, "Invalid video ID");
    }

    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);


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

    const videoExists = await Video.exists({
        _id: videoObjectId,
        isPublished: true
    });

    if (!videoExists) {
        throw new apierror(404, "Video not found");
    }

    

    const comments = await Comments.aggregate([
        {
            $match: {
                Videos: videoObjectId
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
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "likes",

                let: {
                    commentId: "$_id"
                },

                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$comment",
                                    "$$commentId"
                                ]
                            }
                        }
                    },

                    {
                        $count: "count"
                    }
                ],

                as: "likeStats"
            }
        },
        {
            $lookup: {
                from: "likes",

                let: {
                    commentId: "$_id"
                },

                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$comment",
                                            "$$commentId"
                                        ]
                                    },

                                    {
                                        $eq: [
                                            "$Likedby",
                                            userObjectId
                                        ]
                                    }
                                ]
                            }
                        }
                    },

                    {
                        $limit: 1
                    }
                ],

                as: "currentUserLike"
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,

                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                },

                likeCount: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$likeStats.count",
                                0
                            ]
                        },
                        0
                    ]
                },

                liked: {
                    $gt: [
                        {
                            $size: "$currentUserLike"
                        },
                        0
                    ]
                }
            }
        }
    ]);
    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Comments retrieved successfully",
                {
                    page,
                    limit,
                    comments
                }
            )
        );
});
export {
  uploadvideo,
  getVideoById,
  getAllVideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getWatchVideo,
  getVideoComments
};
