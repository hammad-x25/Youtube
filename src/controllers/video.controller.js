import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { deleteFromCloudinary, uploadhandler } from "../utils/cloudinary.js";
import { apiresponse } from "../utils/apiresponse.js";
import fs from "fs";
import { getPublicIdFromUrl } from "../utils/getidfromurl.js";
import mongoose from "mongoose";

const uploadvideo = asyncHandler(async (req, res) => {
  try {
    const Thumbnailpath = req.files.Thumbnail.path;
    const videopath = req.files.VideoFile.path;
    const title = req.body.title;
    const description = req.body.description;
    const isPublished = req.body.isPublished;

    if (description.trim() == "" || title.trim() == "") {
      throw new apierror(400, "Wrong title or description");
    }

    if (!Thumbnailpath || !videopath) {
      throw new apierror(503, "ERROR while uploading content");
    }

    const video = await uploadhandler(videopath);
    const Thumbnail = await uploadhandler(Thumbnailpath);

    if (!video || !Thumbnail) {
      throw new apierror(503, "ERROR while uploading content to cloud");
    }

    const videodb = await Video.create({
      title,
      description,
      owner: req.user.id,
      VideoFile: video.url,
      Thumbnail: Thumbnail.url,
      isPublished,
      views: 0,
      duration: video.duration,
    });

    const videocreated = await Video.findById(videodb._id);
    if (!videocreated) {
      const publicid_vid = getPublicIdFromUrl(video.url);
      const publicid_thumbnail = getPublicIdFromUrl(Thumbnail.url);
      await deleteFromCloudinary(publicid_vid, "Video");
      await deleteFromCloudinary(publicid_thumbnail);
      throw new apierror(500, "Error Creating entry in database");
    }

    return res
      .status(200)
      .json(new apiresponse(200, "Video Updated", videocreated));
  } catch (error) {
    if (Thumbnailpath) {
      await fs.promises.unlink(Thumbnailpath).catch(() => {});
    }
    if (videopath) {
      await fs.promises.unlink(videopath).catch(() => {});
    }
  }
});
