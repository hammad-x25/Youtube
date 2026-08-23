
import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { Playlist } from "../models/playlist.models.js";

import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (
        typeof name !== "string" ||
        name.trim().length === 0
    ) {
        throw new apierror(
            400,
            "Playlist name is required"
        );
    }
    if (
        typeof description !== "string" ||
        description.trim().length === 0
    ) {
        throw new apierror(
            400,
            "Playlist description is required"
        );
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
        Videos: []
    });

    if (!playlist) {
        throw new apierror(
            500,
            "Playlist could not be created"
        );
    }

    return res
        .status(201)
        .json(
            new apiresponse(
                201,
                "Playlist created successfully",
                playlist
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new apierror(400, "Invalid playlist ID");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new apierror(400, "Invalid video ID");
    }

    const videoExists = await Video.exists({
        _id: videoId,   
         isPublished: true

    });

    if (!videoExists) {
        throw new apierror(404, "Video not found");
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $addToSet: {
                Videos: videoId
            }
        },
        {
            new: true
        }
    );

    if (!updatedPlaylist) {

        const playlistExists = await Playlist.exists({
            _id: playlistId
        });

        if (!playlistExists) {
            throw new apierror(404, "Playlist not found");
        }

        throw new apierror(
            403,
            "You are not allowed to modify this playlist"
        );
    }

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Video added to playlist successfully",
                updatedPlaylist
            )
        );
});


export {createPlaylist,addVideoToPlaylist}