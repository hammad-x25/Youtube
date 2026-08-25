import mongoose, { Schema } from "mongoose";

const LikeSchema = new mongoose.Schema(
    {
        Video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },

        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comments",
        },

        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweets",
        },

        Likedby: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


// Exactly ONE target must exist
LikeSchema.pre("validate", function (next) {
    const targets = [
        this.Video,
        this.comment,
        this.tweet,
    ].filter(Boolean);

    if (targets.length !== 1) {
        return next(
            new Error(
                "A like must belong to exactly one video, comment, or tweet"
            )
        );
    }

    next();
});


// One user can like a particular video only once
LikeSchema.index(
    { Likedby: 1, Video: 1 },
    { unique: true, sparse: true }
);


// One user can like a particular comment only once
LikeSchema.index(
    { Likedby: 1, comment: 1 },
    { unique: true, sparse: true }
);


// One user can like a particular tweet only once
LikeSchema.index(
    { Likedby: 1, tweet: 1 },
    { unique: true, sparse: true }
);
LikeSchema.index({
    Video: 1
});

//indexes are used so that we can prevent from race conditions

export const Likes = mongoose.model("Likes", LikeSchema);