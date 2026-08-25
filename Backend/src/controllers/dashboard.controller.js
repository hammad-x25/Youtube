import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Likes } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Playlist } from "../models/playlist.models.js";
import { Tweets } from "../models/tweets.models.js";

const getDashboard = asyncHandler(async (req, res) => {
  if (!req.user?._id) throw new apierror(401, "Unauthorized request");

  const userId = new mongoose.Types.ObjectId(req.user._id);
  const [videos, subscriberCount, followingCount, subscribers, channels, playlists, tweets] = await Promise.all([
    Video.aggregate([
      { $match: { owner: userId } },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $lookup: {
          from: "likes",
          let: { videoId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$Video", "$$videoId"] } } }, { $count: "count" }],
          as: "likeStats",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { videoId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$Videos", "$$videoId"] } } }, { $count: "count" }],
          as: "commentStats",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          Thumbnail: 1,
          VideoFile: 1,
          description: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          createdAt: 1,
          likeCount: { $ifNull: [{ $arrayElemAt: ["$likeStats.count", 0] }, 0] },
          commentsCount: { $ifNull: [{ $arrayElemAt: ["$commentStats.count", 0] }, 0] },
        },
      },
    ]),
    Subscription.countDocuments({ channel: userId }),
    Subscription.countDocuments({ subscriber: userId }),
    Subscription.find({ channel: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("subscriber", "username fullName avatar")
      .lean(),
    Subscription.find({ subscriber: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("channel", "username fullName avatar")
      .lean(),
    Playlist.find({ owner: userId })
      .sort({ createdAt: -1 })
      .select("name description Videos createdAt updatedAt")
      .lean(),
    Tweets.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("owner", "username fullName avatar")
      .lean(),
  ]);

  const totalViews = videos.reduce((total, video) => total + (video.views || 0), 0);
  const totalLikes = videos.reduce((total, video) => total + (video.likeCount || 0), 0);
  const publishedVideos = videos.filter((video) => video.isPublished).length;

  return res.status(200).json(new apiresponse(200, "Dashboard retrieved successfully", {
    summary: {
      totalViews,
      totalLikes,
      totalVideos: videos.length,
      publishedVideos,
      subscriberCount,
      followingCount,
    },
    videos,
    subscribers,
    channels,
    playlists: playlists.map((playlist) => ({ ...playlist, videoCount: playlist.Videos?.length || 0 })),
    tweets,
  }));
});

export { getDashboard };
