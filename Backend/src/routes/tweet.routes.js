import { Router } from "express";

import {
    createTweet,
    getTweetById,
    getUserTweets,
    getFeedTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const tweetRouter = Router();

tweetRouter.post(
    "/",
    verifyJWT,
    createTweet
);

tweetRouter.get(
    "/feed",
    verifyJWT,
    getFeedTweets
);

tweetRouter.get(
    "/user/:userId",
    verifyJWT,
    getUserTweets
);

tweetRouter.get(
    "/:tweetId",
    verifyJWT,
    getTweetById
);

tweetRouter.patch(
    "/:tweetId",
    verifyJWT,
    updateTweet
);

tweetRouter.delete(
    "/:tweetId",
    verifyJWT,
    deleteTweet
);

export default tweetRouter;