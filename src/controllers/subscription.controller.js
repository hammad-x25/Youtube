import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";

const subscribeToChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid channel ID");
  }
  const subscriberId = req.user._id;

  if (subscriberId.toString() === channelId.toString()) {
    throw new apierror(400, "You cannot subscribe to yourself");
  }
  const channel = await User.exists({
    _id: channelId,
  });

  if (!channel) {
    throw new apierror(404, "Channel not found");
  }
  const existingSubscription = await Subscription.exists({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    throw new apierror(409, "Already subscribed to this channel");
  }
  const subscription = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (!subscription) {
    throw new apierror(500, "Failed to subscribe to channel");
  }

  return res
    .status(201)
    .json(new apiresponse(201, "Subscribed successfully", subscription));
});

const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // 1. Validate channel ID
  if (!mongoose.isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid channel ID");
  }

  const subscriberId = req.user._id;

  const subscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (!subscription) {
    throw new apierror(404, "You are not subscribed to this channel");
  }

  await Subscription.deleteOne({
    _id: subscription._id,
  });

  return res
    .status(200)
    .json(new apiresponse(200, "Unsubscribed successfully", null));
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid channel ID");
  }

  const channelExists = await User.exists({
    _id: channelId,
  });

  if (!channelExists) {
    throw new apierror(404, "Channel not found");
  }

  const page = Math.max(Number.parseInt(req.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit) || 20, 1),
    50,
  );

  const skip = (page - 1) * limit;

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,

        subscribedAt: "$createdAt",

        subscriber: {
          _id: "$subscriber._id",
          username: "$subscriber.username",
          fullName: "$subscriber.fullName",
          avatar: "$subscriber.avatar",
        },
      },
    },
    {
      $sort: {
        subscribedAt: -1,
        "subscriber._id": -1,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ]);

  return res
    .status(200)
    .json(
      new apiresponse(
        200,
        subscribers.length
          ? "Subscribers retrieved successfully"
          : "No subscribers found",
        subscribers,
      ),
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = Math.max(Number.parseInt(req.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit) || 20, 1),
    50,
  );

  const skip = (page - 1) * limit;

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },

    {
      $unwind: "$channel",
    },

    {
      $project: {
        _id: 0,

        subscribedAt: "$createdAt",

        channel: {
          _id: "$channel._id",
          username: "$channel.username",
          fullName: "$channel.fullName",
          avatar: "$channel.avatar",
        },
      },
    },

    {
      $sort: {
        subscribedAt: -1,
        "channel._id": -1,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ]);

  return res
    .status(200)
    .json(
      new apiresponse(
        200,
        channels.length
          ? "Subscribed channels retrieved successfully"
          : "No subscribed channels found",
        channels,
      ),
    );
});

const getSubscriberCount = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid channel ID");
  }

  const channelExists = await User.exists({
    _id: channelId,
  });

  if (!channelExists) {
    throw new apierror(404, "Channel not found");
  }

  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new apiresponse(200, "Subscriber count retrieved successfully", {
        subscriberCount,
      }),
    );
});
const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid channel ID");
  }

  const subscription = await Subscription.exists({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res.status(200).json(
    new apiresponse(200, "Subscription status retrieved successfully", {
      isSubscribed: !!subscription,
    }),
  );
});
export {
  subscribeToChannel,
  unsubscribeFromChannel,
  getChannelSubscribers,
  getSubscribedChannels,
  getSubscriberCount,
  getSubscriptionStatus,
};
