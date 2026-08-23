import { Router } from "express";
import {
  registerUser,
  confirmEmail,
  resendEmailVerification,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchedHistory,
  removeFromWatchHistory,
  clearWatchHistory,
  getlatesttweetsofsubscribedchannels,
} from "../controllers/user.controller.js";
import { updateAvatar } from "../controllers/avatar.controller.js";
import {
  updateCoverImage,
  deleteCoverImage,
} from "../controllers/coverimage.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/confirm-email").get(confirmEmail);
router.route("/resend-confirmation").post(resendEmailVerification);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/update-coverimage")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/delete-coverimage").delete(verifyJWT, deleteCoverImage);
router.route("/account-details").patch(verifyJWT, updateAccountDetails);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watched-history").get(verifyJWT, getWatchedHistory);
router.route("/watched-history").delete(verifyJWT, clearWatchHistory);
router
  .route("/watched-history/:videoId")
  .delete(verifyJWT, removeFromWatchHistory);
router.route("/subscribed-tweets").get(verifyJWT, getlatesttweetsofsubscribedchannels);
export default router;
