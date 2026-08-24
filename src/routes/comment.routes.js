import { Router } from "express";
import { createComment,deleteComment,updateComment} from "../controllers/comment.controller.js";
const commentRouter =Router();

commentRouter.post(
    "/:videoId",
    verifyJWT,
    createComment
);

commentRouter.patch(
    "/:commentId",
    verifyJWT,
    updateComment
);

commentRouter.delete(
    "/:commentId",
    verifyJWT,
    deleteComment
);
export default commentRouter;