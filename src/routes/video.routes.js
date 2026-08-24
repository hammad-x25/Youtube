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

const videoRouter = Router();


videoRouter.get("/", getAllVideos);

videoRouter.get("/:videoId", getVideoById);


videoRouter.get(
    "/:videoId/watch",
    verifyJWT,
    getWatchVideo
);


videoRouter.post(
    "/:videoId/watch-history",
    verifyJWT,
    addToWatchHistory
);


videoRouter.get(
    "/:videoId/comments",
    getVideoComments
);


videoRouter.post(
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

videoRouter.patch(
    "/:videoId",
    verifyJWT,
    updateVideo
);

videoRouter.delete(
    "/:videoId",
    verifyJWT,
    deleteVideo
);

videoRouter.patch(
    "/:videoId/publish",
    verifyJWT,
    togglePublishStatus
);

export default videoRouter;