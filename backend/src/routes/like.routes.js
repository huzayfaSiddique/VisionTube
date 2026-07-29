import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getUserLikedVideos,
  getUserLikedTweets,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/video/:videoId").post(toggleVideoLike);
router.route("/comment/:commentId").post(toggleCommentLike);
router.route("/tweet/:tweetId").post(toggleTweetLike);
router.route("/liked-videos/:userId").get(getUserLikedVideos);
router.route("/liked-tweets/:userId").get(getUserLikedTweets);

export default router;