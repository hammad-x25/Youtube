import { asyncHandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { Video } from "../models/video.models.js";
import { Comments } from "../models/comment.models.js";
import { Likes } from "../models/like.models.js";
import { User } from "../models/user.models.js";
import { apiresponse } from "../utils/apiresponse.js";
import mongoose from "mongoose";

const createComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new apierror(400, "Invalid video ID");
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new apierror(400, "Comment cannot be empty");
  }

  const cleanContent = content.trim();

  const videoExists = await Video.exists({
    _id: videoId,
    isPublished: true,
  });

  if (!videoExists) {
    throw new apierror(404, "Video not found");
  }

  const comment = await Comments.create({
    content: cleanContent,
    Videos: videoId,
    owner: req.user._id,
  });

  const createdComment = await Comments.findById(comment._id).populate(
    "owner",
    "username fullName avatar",
  );

  if (!createdComment) {
    throw new apierror(500, "Comment could not be created");
  }

  return res
    .status(201)
    .json(new apiresponse(201, "Comment created successfully", createdComment));
});


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;


    if (!mongoose.isValidObjectId(commentId)) {
        throw new apierror(400, "Invalid comment ID");
    }


    if (
        typeof content !== "string" ||
        content.trim().length === 0
    ) {
        throw new apierror(
            400,
            "Comment cannot be empty"
        );
    }

    const cleanContent = content.trim();


    const comment = await Comments.findById(commentId);

    if (!comment) {
        throw new apierror(
            404,
            "Comment not found"
        );
    }


    if (
        comment.owner.toString() !==
        req.user._id.toString()
    ) {
        throw new apierror(
            403,
            "You are not allowed to update this comment"
        );
    }


    comment.content = cleanContent;

    await comment.save();


    const updatedComment = await Comments
        .findById(comment._id)
        .populate(
            "owner",
            "username fullName avatar"
        );

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                "Comment updated successfully",
                updatedComment
            )
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new apierror(400, "Invalid comment ID");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const comment = await Comments
            .findById(commentId)
            .session(session);

        if (!comment) {
            throw new apierror(404, "Comment not found");
        }

        if (
            comment.owner.toString() !==
            req.user._id.toString()
        ) {
            throw new apierror(
                403,
                "You are not allowed to delete this comment"
            );
        }

        await Likes.deleteMany(
            {
                comment: comment._id
            },
            {
                session
            }
        );

        await Comments.deleteOne(
            {
                _id: comment._id
            },
            {
                session
            }
        );
        await session.commitTransaction();

        return res
            .status(200)
            .json(
                new apiresponse(
                    200,
                    "Comment deleted successfully",
                    null
                )
            );

    } catch (error) {

        await session.abortTransaction();

        throw error;

    } finally {
    //if works then both transactions works otherwise neither we roll back 
        await session.endSession();
    }
});
export {createComment,updateComment,deleteComment,}
