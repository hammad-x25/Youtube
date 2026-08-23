import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadvideo,
  getVideoById,
  getAllVideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,getWatchVideo,getVideoComments} from "../controllers/video.controller.js" 

const videorouter= Router();

videorouter.route("/videos")
  .post(
    verifyJWT,
    upload.fields([
      { name: "VideoFile", maxCount: 1 },
      { name: "Thumbnail", maxCount: 1 }
    ]),
    createVideo
  );

videorouter.route("/videos/:videoId").get(getVideoById);
videorouter.get(
    "/videos/:videoId/watch",
    verifyJWT,
    getWatchVideo
);
videorouter.get(
    "/videos/:videoId/comments",
    verifyJWT,
    getVideoComments
);
export {videorouter};