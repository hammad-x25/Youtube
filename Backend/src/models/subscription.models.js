import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

SubscriptionSchema.index(
    { subscriber: 1, channel: 1 },
    { unique: true }
);

SubscriptionSchema.index({
    channel: 1
});

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);