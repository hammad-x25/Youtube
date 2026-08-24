import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getPlaylistById,
  getUserPlaylists
} from "../controllers/playlist.controller.js";
  

const router = Router();

router.post("/", verifyJWT, createPlaylist);

router.post("/:playlistId/videos/:videoId", verifyJWT, addVideoToPlaylist);
router.delete(
  "/:playlistId/videos/:videoId",
  verifyJWT,
  removeVideoFromPlaylist,
);

router.get("/:playlistId", getPlaylistById);

router.get("/", verifyJWT, getUserPlaylists);

router.patch("/:playlistId", verifyJWT, updatePlaylist);

router.delete("/:playlistId", verifyJWT, deletePlaylist);
