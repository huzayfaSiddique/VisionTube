import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideoinfo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";

import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.use(verifyJWT);

router.route("/publish-video").post(
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);
router.route("/update/:videoId").patch(upload.single("thumbnail"),updateVideoinfo);
router.route("/delete/:videoId").delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;