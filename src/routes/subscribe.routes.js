import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
  getChannelSubscribers,
  getSubscribedChannels,
  getSubscriberCount,
  getSubscriptionStatus,
} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();
subscriptionRouter.post("/:channelId", verifyJWT, subscribeToChannel);

subscriptionRouter.delete("/:channelId", verifyJWT, unsubscribeFromChannel);

subscriptionRouter.get("/:channelId/subscribers", getChannelSubscribers);

subscriptionRouter.get("/subscribed", verifyJWT, getSubscribedChannels);

subscriptionRouter.get("/:channelId/count", getSubscriberCount);

subscriptionRouter.get("/:channelId/status", verifyJWT, getSubscriptionStatus);
export default subscriptionRouter;