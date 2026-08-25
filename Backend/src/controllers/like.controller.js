import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { Comments } from "../models/comment.models.js";
import { Likes } from "../models/like.models.js";
import {Tweets} from "../models/tweets.models.js";
import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";

const getLikeCount = async (targetField, targetId) =>
    Likes.countDocuments({ [targetField]: targetId });

const createLikeOrResolveRace = async (targetField, targetId, userId) => {
    try {
        await Likes.create({
            Likedby: userId,
            [targetField]: targetId,
        });
        return true;
    } catch (error) {
        // Two fast clicks can both pass the initial findOne. The unique
        // index correctly keeps one document; the second request should
        // observe the resulting liked state instead of surfacing a false
        // "already liked" error to the user.
        if (error.code !== 11000) throw error;

        return Boolean(await Likes.exists({
            Likedby: userId,
            [targetField]: targetId,
        }));
    }
};

const likeResponse = async (res, status, message, targetField, targetId, liked) =>
    res.status(status).json(new apiresponse(status, message, {
        liked,
        likeCount: await getLikeCount(targetField, targetId),
    }));


const toggleVideoLike = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new apierror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apierror(404, "Video not found");
    }

    if (!video.isPublished) {
        throw new apierror(404, "Video not found");
    }

    const existingLike = await Likes.findOne({
        Likedby: req.user._id,
        Video: videoId
    });

    if (existingLike) {

        await Likes.findByIdAndDelete(existingLike._id);

        return likeResponse(res, 200, "Video unliked successfully", "Video", videoId, false);
    }

    const liked = await createLikeOrResolveRace("Video", videoId, req.user._id);
    return likeResponse(res, 200, "Video liked successfully", "Video", videoId, liked);
});


const toggleCommentLike = asyncHandler(async (req, res) => {

    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new apierror(400, "Invalid comment ID");
    }

    const comment = await Comments
        .findById(commentId)
        .select("Videos");

    if (!comment) {
        throw new apierror(404, "Comment not found");
    }

    const video = await Video
        .findById(comment.Videos)
        .select("isPublished");

    if (!video || !video.isPublished) {
        throw new apierror(404, "Video not found");
    }

    const existingLike = await Likes.findOne({
        Likedby: req.user._id,
        comment: commentId
    });

    if (existingLike) {

        await Likes.findByIdAndDelete(existingLike._id);

        return likeResponse(res, 200, "Comment unliked successfully", "comment", commentId, false);
    }

    const liked = await createLikeOrResolveRace("comment", commentId, req.user._id);
    return likeResponse(res, 200, "Comment liked successfully", "comment", commentId, liked);
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new apierror(400, "Invalid tweet ID");
    }
    const tweet = await Tweets
        .findById(tweetId)
        .select("_id");

    if (!tweet) {
        throw new apierror(404, "Tweet not found");
    }

    const existingLike = await Likes.findOne({
        Likedby: req.user._id,
        tweet: tweetId
    });

    if (existingLike) {
        await Likes.findByIdAndDelete(existingLike._id);

        return likeResponse(res, 200, "Tweet unliked successfully", "tweet", tweetId, false);
    }

    const liked = await createLikeOrResolveRace("tweet", tweetId, req.user._id);
    return likeResponse(res, 200, "Tweet liked successfully", "tweet", tweetId, liked);
});


export 
{
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike
}
