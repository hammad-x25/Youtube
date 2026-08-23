import { Router } from "express";
import { createComment,deleteComment,updateComment } from "../controllers/comment.controller";
import { getVideoComments } from "../controllers/video.controller";
const router =Router();

router.post(
    "/:videoId",
    verifyJWT,
    createComment
);

router.get(
    "/:videoId",
    verifyJWT,
    getVideoComments
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