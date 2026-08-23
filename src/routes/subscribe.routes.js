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

const router = Router();
router.post("/:channelId", verifyJWT, subscribeToChannel);

router.delete("/:channelId", verifyJWT, unsubscribeFromChannel);

router.get("/:channelId/subscribers", getChannelSubscribers);

router.get("/subscribed", verifyJWT, getSubscribedChannels);

router.get("/:channelId/count", getSubscriberCount);

router.get("/:channelId/status", verifyJWT, getSubscriptionStatus);
