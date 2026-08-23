import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";


const router=Router();

router.post(
    "/",
    verifyJWT,
    createPlaylist
);

router.post(
    "/:playlistId/videos/:videoId",
    verifyJWT,
    addVideoToPlaylist
);