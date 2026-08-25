import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { Comments } from "../models/comment.models.js";
import { Likes } from "../models/like.models.js";
import {Tweets} from "../models/tweets.models.js";
import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";


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

        return res
            .status(200)
            .json(
                new apiresponse(
                    200,
                    "Video unliked successfully",
                    {
                        liked: false
                    }
                )
            );
    }

    try {

        await Likes.create({
            Likedby: req.user._id,
            Video: videoId
        });

    } catch (error) {

        if (error.code === 11000) {
            throw new apierror(
                409,
                "Video is already liked"
            );
        }

        throw error;
    }

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Video liked successfully",
                {
                    liked: true
                }
            )
        );
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

        return res
            .status(200)
            .json(
                new apiresponse(
                    200,
                    "Comment unliked successfully",
                    {
                        liked: false
                    }
                )
            );
    }

    try {

        await Likes.create({
            Likedby: req.user._id,
            comment: commentId
        });

    } catch (error) {

        if (error.code === 11000) {
            throw new apierror(
                409,
                "Comment is already liked"
            );
        }

        throw error;
    }

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Comment liked successfully",
                {
                    liked: true
                }
            )
        );
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

        return res
            .status(200)
            .json(
                new apiresponse(
                    200,
                    "Tweet unliked successfully",
                    {
                        liked: false
                    }
                )
            );
    }

    try {
        await Likes.create({
            Likedby: req.user._id,
            tweet: tweetId
        });

    } catch (error) {

        if (error.code === 11000) {
            throw new apierror(
                409,
                "Tweet is already liked"
            );
        }

        throw error;
    }

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Tweet liked successfully",
                {
                    liked: true
                }
            )
        );
});


export 
{
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike
}