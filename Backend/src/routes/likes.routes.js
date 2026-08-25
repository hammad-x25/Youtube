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
    "/video/:videoId",
    toggleVideoLike
);

likeRouter.post("/tweet/:tweetId", toggleTweetLike);

likeRouter.post("/comment/:commentId", toggleCommentLike);
export default likeRouter;
