import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike
} from "../controllers/like.controller.js"
const likeRouter=Router();


likeRouter.use(verifyJWT);

likeRouter.post(
    "/likes/tweet/:tweetId",
    toggleTweetLike
);

likeRouter.post(
    "/likes/comment/:commentId",
    toggleCommentLike
);

likeRouter.post(
    "/likes/video/:videoId",
    toggleVideoLike
);
export default likeRouter;