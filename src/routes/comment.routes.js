import { Router } from "express";
import { createComment,deleteComment,updateComment} from "../controllers/comment.controller.js";
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
export default router;