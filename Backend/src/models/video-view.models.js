import mongoose, { Schema } from "mongoose";

const videoViewSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    viewKey: {
      type: String,
      required: true,
      maxlength: 128,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

videoViewSchema.index({ video: 1, viewKey: 1 }, { unique: true });

export const VideoView = mongoose.model("VideoView", videoViewSchema);
