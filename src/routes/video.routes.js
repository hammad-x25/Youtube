import { Router } from "express";

import {
    uploadvideo,
    getVideoById,
    getAllVideos,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getWatchVideo,
    getVideoComments,
    addToWatchHistory
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.get("/", getAllVideos);

router.get("/:videoId", getVideoById);


router.get(
    "/:videoId/watch",
    verifyJWT,
    getWatchVideo
);


router.post(
    "/:videoId/watch-history",
    verifyJWT,
    addToWatchHistory
);


router.get(
    "/:videoId/comments",
    getVideoComments
);


router.post(
    "/upload",
    verifyJWT,
    upload.fields([
        {
            name: "VideoFile",
            maxCount: 1
        },
        {
            name: "Thumbnail",
            maxCount: 1
        }
    ]),
    uploadvideo
);

router.patch(
    "/:videoId",
    verifyJWT,
    updateVideo
);

router.delete(
    "/:videoId",
    verifyJWT,
    deleteVideo
);

router.patch(
    "/:videoId/publish",
    verifyJWT,
    togglePublishStatus
);

export default router;