import {Router} from "express"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import{
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";

const router=Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/update-playlist/:playlistId").patch(updatePlaylist)

router.route("/delete-playlist/:playlistId").delete(deletePlaylist)

router.route("/:playlistId").get(getPlaylistById)

router.route("/user/:userId").get(getUserPlaylists)

router.route("/:videoId/:playlistId").delete(removeVideoFromPlaylist)

router.route("/:videoId/:playlistId").post(addVideoToPlaylist)

export default router;
