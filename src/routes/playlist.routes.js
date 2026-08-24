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
  

const playlistRouter = Router();

playlistplaylistRouter.post("/", verifyJWT, createPlaylist);

playlistRouter.post("/:playlistId/videos/:videoId", verifyJWT, addVideoToPlaylist);
playlistRouter.delete(
  "/:playlistId/videos/:videoId",
  verifyJWT,
  removeVideoFromPlaylist,
);

playlistRouter.get("/:playlistId", getPlaylistById);

playlistRouter.get("/", verifyJWT, getUserPlaylists);

playlistRouter.patch("/:playlistId", verifyJWT, updatePlaylist);

playlistRouter.delete("/:playlistId", verifyJWT, deletePlaylist);
export default playlistRouter;