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

const router = Router();

router.post(
    "/",
    verifyJWT,
    createTweet
);

router.get(
    "/feed",
    verifyJWT,
    getFeedTweets
);

router.get(
    "/user/:userId",
    verifyJWT,
    getUserTweets
);

router.get(
    "/:tweetId",
    verifyJWT,
    getTweetById
);

router.patch(
    "/:tweetId",
    verifyJWT,
    updateTweet
);

router.delete(
    "/:tweetId",
    verifyJWT,
    deleteTweet
);

export default router;