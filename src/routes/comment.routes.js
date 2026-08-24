import { Router } from "express";
import { createComment,deleteComment,updateComment} from "../controllers/comment.controller.js";
import { getVideoComments } from "../controllers/video.controller";
const router =Router();

router.post(
    "/:videoId",
    verifyJWT,
    createComment
);

router.patch(
    "/:commentId",
    verifyJWT,
    updateComment
);

router.delete(
    "/:commentId",
    verifyJWT,
    deleteComment
);