import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { Playlist } from "../models/playlist.models.js";
import { User } from "../models/user.models.js";
import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (typeof name !== "string" || name.trim().length === 0) {
    throw new apierror(400, "Playlist name is required");
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    throw new apierror(400, "Playlist description is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
    Videos: [],
  });

  if (!playlist) {
    throw new apierror(500, "Playlist could not be created");
  }

  return res
    .status(201)
    .json(new apiresponse(201, "Playlist created successfully", playlist));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new apierror(400, "Invalid playlist ID");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }

  const videoExists = await Video.exists({
    _id: videoId,
    isPublished: true,
  });

  if (!videoExists) {
    throw new apierror(404, "Video not found");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      $addToSet: {
        Videos: videoId,
      },
    },
    {
      new: true,
    },
  );

  if (!updatedPlaylist) {
    const playlistExists = await Playlist.exists({
      _id: playlistId,
    });

    if (!playlistExists) {
      throw new apierror(404, "Playlist not found");
    }

    throw new apierror(403, "You are not allowed to modify this playlist");
  }

  return res
    .status(200)
    .json(
      new apiresponse(
        200,
        "Video added to playlist successfully",
        updatedPlaylist,
      ),
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new apierror(400, "Invalid playlist ID");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      $pull: {
        Videos: videoId,
      },
    },
    {
      new: true,
    },
  );

  if (!updatedPlaylist) {
    throw new apierror(
      404,
      "Playlist not found or you are not allowed to modify it",
    );
  }

  return res
    .status(200)
    .json(
      new apiresponse(
        200,
        "Video removed from playlist successfully",
        updatedPlaylist,
      ),
    );
});
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new apierror(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
      $unwind: {
        path: "$Videos",
        includeArrayIndex: "videoOrder",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "Videos",
        foreignField: "_id",
        as: "video",
      },
    },

    {
      $unwind: {
        path: "$video",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $match: {
        $or: [
          {
            video: {
              $exists: false,
            },
          },
          {
            "video.isPublished": true,
          },
        ],
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "video.owner",
        foreignField: "_id",
        as: "videoOwner",
      },
    },

    {
      $unwind: {
        path: "$videoOwner",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $sort: {
        videoOrder: 1,
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,

        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },

        videoOrder: 1,

        video: {
          $cond: [
            {
              $ne: ["$video", null],
            },
            {
              _id: "$video._id",
              VideoFile: "$video.VideoFile",
              Thumbnail: "$video.Thumbnail",
              title: "$video.title",
              description: "$video.description",
              duration: "$video.duration",
              views: "$video.views",
              createdAt: "$video.createdAt",

              owner: {
                _id: "$videoOwner._id",
                username: "$videoOwner.username",
                fullName: "$videoOwner.fullName",
                avatar: "$videoOwner.avatar",
              },
            },
            null,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$_id",

        name: {
          $first: "$name",
        },

        description: {
          $first: "$description",
        },

        createdAt: {
          $first: "$createdAt",
        },

        updatedAt: {
          $first: "$updatedAt",
        },

        owner: {
          $first: "$owner",
        },

        Videos: {
          $push: "$video",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,

        Videos: {
          $filter: {
            input: "$Videos",
            as: "video",
            cond: {
              $ne: ["$$video", null],
            },
          },
        },
      },
    },
  ]);

  if (!playlist.length) {
    throw new apierror(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new apiresponse(200, "Playlist retrieved successfully", playlist[0]));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit) || 10, 1),
    50,
  );

  const skip = (page - 1) * limit;

  const userId = new mongoose.Types.ObjectId(req.user._id);

  const [playlists, totalPlaylists] = await Promise.all([
    Playlist.aggregate([
      {
        $match: {
          owner: userId,
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
          from: "videos",

          let: {
            playlistVideos: "$Videos",
          },

          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $in: ["$_id", "$$playlistVideos"],
                    },
                    {
                      $eq: ["$isPublished", true],
                    },
                  ],
                },
              },
            },

            {
              $project: {
                _id: 1,
              },
            },
          ],

          as: "visibleVideos",
        },
      },
      {
        $addFields: {
          videoCount: {
            $size: "$visibleVideos",
          },
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          videoCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]),

    Playlist.countDocuments({
      owner: req.user._id,
    }),
  ]);

  const totalPages = Math.ceil(totalPlaylists / limit);

  return res.status(200).json(
    new apiresponse(
      200,
      playlists.length
        ? "Playlists retrieved successfully"
        : "No playlists found",
      {
        playlists,
        pagination: {
          page,
          limit,
          totalPlaylists,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    ),
  );
});
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new apierror(400, "Invalid playlist ID");
    }

    const { name, description } = req.body;

    if(name === undefined && description === undefined) {
        throw new apierror(
            400,
            "At least one field is required"
        );
    }

    const updateData = {};
    if (name !== undefined) {
        if (
            typeof name !== "string" ||
            name.trim() === ""
        ) {
            throw new apierror(
                400,
                "Playlist name cannot be empty"
            );
        }

        updateData.name = name.trim();
    }
    if (description !== undefined) {
        if (
            typeof description !== "string" ||
            description.trim() === ""
        ) {
            throw new apierror(
                400,
                "Playlist description cannot be empty"
            );
        }

        updateData.description = description.trim();
    }
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $set: updateData
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedPlaylist) {
        throw new apierror(
            404,
            "Playlist not found or you are not allowed to update it"
        );
    }

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Playlist updated successfully",
                updatedPlaylist
            )
        );
});
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new apierror(400, "Invalid playlist ID");
    }

    const deletedPlaylist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    });

    if (!deletedPlaylist) {
        throw new apierror(
            404,
            "Playlist not found or you are not allowed to delete it"
        );
    }

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Playlist deleted successfully",
                deletedPlaylist
            )
        );
});
export {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist
};
