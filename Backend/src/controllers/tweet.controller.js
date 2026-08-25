import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Likes } from "../models/like.models.js";
import { User } from "../models/user.models.js";
import { Tweets } from "../models/tweets.models.js";
import { Subscription } from "../models/subscription.models.js";
import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (content === undefined) {
    throw new apierror(400, "Tweet content is required");
  }

  if (typeof content !== "string") {
    throw new apierror(400, "Tweet content must be a string");
  }

  if (content.trim() === "") {
    throw new apierror(400, "Tweet content cannot be empty");
  }

  const tweet = await Tweets.create({
    content: content.trim(),
    owner: req.user._id,
  });

  if (!tweet) {
    throw new apierror(500, "Tweet could not be created");
  }

  return res
    .status(201)
    .json(new apiresponse(201, "Tweet created successfully", tweet));
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new apierror(400, "Tweet ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new apierror(400, "Invalid tweet ID");
  }

  if (!req.user?._id) {
    throw new apierror(401, "Unauthorized request");
  }

  const userId = new mongoose.Types.ObjectId(req.user._id);
  const tweetObjectId = new mongoose.Types.ObjectId(tweetId);

  const tweet = await Tweets.aggregate([
    {
      $match: {
        _id: tweetObjectId,
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
          tweetId: "$_id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$tweet", "$$tweetId"],
              },
            },
          },

          {
            $group: {
              _id: null,

              likesCount: {
                $sum: 1,
              },

              isLiked: {
                $max: {
                  $cond: [
                    {
                      $eq: ["$Likedby", userId],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],

        as: "likeStats",
      },
    },

    {
      $addFields: {
        likesCount: {
          $ifNull: [
            {
              $arrayElemAt: ["$likeStats.likesCount", 0],
            },
            0,
          ],
        },

        isLiked: {
          $eq: [
            {
              $ifNull: [
                {
                  $arrayElemAt: ["$likeStats.isLiked", 0],
                },
                0,
              ],
            },
            1,
          ],
        },
      },
    },

    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,

        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },

        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);
  if (!tweet.length) {
    throw new apierror(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new apiresponse(200, "Tweet retrieved successfully", tweet[0]));
});
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apierror(400, "User ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apierror(400, "Invalid user ID");
  }

  if (!req.user?._id) {
    throw new apierror(401, "Unauthorized request");
  }

  const targetUserId = new mongoose.Types.ObjectId(userId);
  const currentUserId = new mongoose.Types.ObjectId(req.user._id);

  let { page = 1, limit = 10 } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new apierror(400, "Page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new apierror(400, "Limit must be a positive integer");
  }

  if (limit > 50) {
    limit = 50;
  }

  const skip = (page - 1) * limit;

  const result = await Tweets.aggregate([
    // 1. Only this user's tweets
    {
      $match: {
        owner: targetUserId,
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
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
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
          tweetId: "$_id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$tweet", "$$tweetId"],
              },
            },
          },

          {
            $group: {
              _id: null,

              likesCount: {
                $sum: 1,
              },

              isLiked: {
                $max: {
                  $cond: [
                    {
                      $eq: ["$Likedby", currentUserId],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],

        as: "likeStats",
      },
    },

    {
      $addFields: {
        likesCount: {
          $ifNull: [
            {
              $arrayElemAt: ["$likeStats.likesCount", 0],
            },
            0,
          ],
        },

        isLiked: {
          $eq: [
            {
              $ifNull: [
                {
                  $arrayElemAt: ["$likeStats.isLiked", 0],
                },
                0,
              ],
            },
            1,
          ],
        },
      },
    },

    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,

        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },

        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  const totalTweets = await Tweets.countDocuments({
    owner: targetUserId,
  });

  const totalPages = Math.ceil(totalTweets / limit);

  return res.status(200).json(
    new apiresponse(200, "User tweets retrieved successfully", {
      tweets: result,

      pagination: {
        page,
        limit,
        totalTweets,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }),
  );
});

const getFeedTweets = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apierror(401, "Unauthorized request");
  }

  const currentUserId = new mongoose.Types.ObjectId(req.user._id);

  let { page = 1, limit = 10 } = req.query;
  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new apierror(400, "Page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new apierror(400, "Limit must be a positive integer");
  }

  limit = Math.min(limit, 50);

  const skip = (page - 1) * limit;

  const result = await Subscription.aggregate([
    {
      $match: {
        subscriber: currentUserId,
      },
    },

    {
      $lookup: {
        from: "tweets",

        let: {
          channelId: "$channel",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$owner", "$$channelId"],
              },
            },
          },

          {
            $sort: {
              createdAt: -1,
              _id: -1,
            },
          },

          {
            $limit: 1,
          },
        ],

        as: "latestTweet",
      },
    },

    {
      $unwind: "$latestTweet",
    },

    {
      $replaceRoot: {
        newRoot: "$latestTweet",
      },
    },

    {
      $facet: {
        tweets: [
          {
            $sort: {
              createdAt: -1,
              _id: -1,
            },
          },

          // Pagination
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

              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],

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
                tweetId: "$_id",
              },

              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$tweet", "$$tweetId"],
                    },
                  },
                },

                {
                  $group: {
                    _id: null,

                    likesCount: {
                      $sum: 1,
                    },

                    isLiked: {
                      $max: {
                        $cond: [
                          {
                            $eq: ["$Likedby", currentUserId],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
              ],

              as: "likeStats",
            },
          },
          {
            $addFields: {
              likesCount: {
                $ifNull: [
                  {
                    $arrayElemAt: ["$likeStats.likesCount", 0],
                  },
                  0,
                ],
              },

              isLiked: {
                $eq: [
                  {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$likeStats.isLiked", 0],
                      },
                      0,
                    ],
                  },
                  1,
                ],
              },
            },
          },

          {
            $project: {
              content: 1,
              createdAt: 1,
              updatedAt: 1,

              owner: {
                _id: "$owner._id",
                username: "$owner.username",
                fullName: "$owner.fullName",
                avatar: "$owner.avatar",
              },

              likesCount: 1,
              isLiked: 1,
            },
          },
        ],

        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    },

    {
      $project: {
        tweets: 1,

        totalTweets: {
          $ifNull: [
            {
              $arrayElemAt: ["$totalCount.count", 0],
            },
            0,
          ],
        },
      },
    },
  ]);

  const tweets = result[0]?.tweets || [];
  const totalTweets = result[0]?.totalTweets || 0;

  const totalPages = Math.ceil(totalTweets / limit);

  return res.status(200).json(
    new apiresponse(200, "Feed tweets retrieved successfully", {
      tweets,

      pagination: {
        page,
        limit,
        totalTweets,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }),
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new apierror(400, "Tweet ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new apierror(400, "Invalid tweet ID");
  }

  if (!req.user?._id) {
    throw new apierror(401, "Unauthorized request");
  }

  if (content === undefined) {
    throw new apierror(400, "Tweet content is required");
  }

  if (typeof content !== "string") {
    throw new apierror(400, "Tweet content must be a string");
  }

  const trimmedContent = content.trim();

  if (trimmedContent === "") {
    throw new apierror(400, "Tweet content cannot be empty");
  }

  const updatedTweet = await Tweets.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(tweetId),
      owner: new mongoose.Types.ObjectId(req.user._id),
    },
    {
      $set: {
        content: trimmedContent,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (!updatedTweet) {
    throw new apierror(404, "Tweet not found");
  }
  return res
    .status(200)
    .json(new apiresponse(200, "Tweet updated successfully", updatedTweet));
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new apierror(400, "Tweet ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new apierror(400, "Invalid tweet ID");
  }

  if (!req.user?._id) {
    throw new apierror(401, "Unauthorized request");
  }

  const tweetObjectId = new mongoose.Types.ObjectId(tweetId);

  const userObjectId = new mongoose.Types.ObjectId(req.user._id);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const tweet = await Tweets.findOne({
      _id: tweetObjectId,
      owner: userObjectId,
    }).session(session);

    if (!tweet) {
      throw new apierror(404, "Tweet not found");
    }

    await Tweets.deleteOne({
      _id: tweetObjectId,
      owner: userObjectId,
    }).session(session);

    await Likes.deleteMany({
      tweet: tweetObjectId,
    }).session(session);

    await session.commitTransaction();

    return res
      .status(200)
      .json(new apiresponse(200, "Tweet deleted successfully", null));
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
});
export {
  createTweet,
  getTweetById,
  getUserTweets,
  getFeedTweets,
  updateTweet,
  deleteTweet,
};
