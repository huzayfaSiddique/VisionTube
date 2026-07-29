import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getSubscribedChannels,
  getSubscribers,
  getUserSubscriptionStatus,
  getChannelSubscribersCount,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/:channelId").post(toggleSubscription);
router.route("/subscribed-channels/:userId").get(getSubscribedChannels);
router.route("/subscribers/:userId").get(getSubscribers);
router.route("/subscription-status/:userId").get(getUserSubscriptionStatus);
router.route("/subscribers-count/:channelId").get(getChannelSubscribersCount);

export default router;