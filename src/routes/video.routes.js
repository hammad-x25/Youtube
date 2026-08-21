import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
export {videorouter};