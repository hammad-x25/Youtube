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

videorouter.route("/")
  .post(
    verifyJWT,
    upload.fields([
      { name: "VideoFile", maxCount: 1 },
      { name: "Thumbnail", maxCount: 1 }
    ]),
    uploadvideo
  );

videorouter.route("/:videoId").get(getVideoById);

//RESOURCE API


//Composition API'S
videorouter.get(
    "/:videoId/watch",
    verifyJWT,
    getWatchVideo
);

videorouter.get(
    "/:videoId/comments",
    verifyJWT,
    getVideoComments
);
export {videorouter};