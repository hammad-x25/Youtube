import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike
} from "../controllers/like.controller.js"
const Likerouter=Router();


Likerouter.use(verifyJWT);

Likerouter.post(
    "/likes/tweet/:tweetId",
    toggleTweetLike
);

Likerouter.post(
    "/likes/comment/:commentId",
    toggleCommentLike
);

Likerouter.post(
    "/likes/video/:videoId",
    toggleVideoLike
);
export default router;