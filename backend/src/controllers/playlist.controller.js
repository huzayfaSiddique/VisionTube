import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Playlist } from "../models/playlist.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description are required");
  }
  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user?._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { videoId } = req.query;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (videoId && !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const isOwner = req.user?._id?.toString() === userId;

  const matchStage = { owner: new mongoose.Types.ObjectId(userId) };
  // Only the owner can see their own private playlists.
  if (!isOwner) {
    matchStage.isPublic = true;
  }

  const addFields = {
    videosCount: { $size: "$videoDocs" },
    thumbnail: { $first: "$videoDocs.thumbnail" },
  };

  // "Save to playlist" (WatchPage) needs to know which of the user's own
  // playlists already contain this video, checked against the raw `videos`
  // ref array (before it gets projected away below).
  if (videoId) {
    addFields.containsVideo = {
      $in: [new mongoose.Types.ObjectId(videoId), "$videos"],
    };
  }

  const playlists = await Playlist.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videoDocs",
        pipeline: [
          { $match: { isPublished: true } },
          { $project: { thumbnail: 1 } },
        ],
      },
    },
    { $addFields: addFields },
    { $project: { videoDocs: 0, videos: 0 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const result = await Playlist.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          // Playlists can reference videos that were later unpublished or
          // deleted (deleteVideo already pulls deleted ones out, but a video
          // can still be unpublished by its owner without leaving the list).
          { $match: { isPublished: true } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
            },
          },
          { $addFields: { owner: { $first: "$owner" } } },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
      },
    },
  ]);

  const playlist = result[0];
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Private playlists are only visible to their owner.
  if (
    !playlist.isPublic &&
    playlist.owner?._id?.toString() !== req.user?._id?.toString()
  ) {
    throw new ApiError(403, "This playlist is private");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }
  if (!name?.trim() && !description?.trim()) {
    throw new ApiError(400, "Name and description are required");
  }
  const playlistResult = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, playlistResult, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }
  const playlistResult = await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, playlistResult, "Playlist deleted successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid playlist ID or Video ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }
  if (playlist.videos.some((id) => id.toString() === videoId)) {
    throw new ApiError(400, "Video already added to playlist");
  }
  const playlistResult = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, playlistResult, "Video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid playlist ID or Video ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }
  const playlistResult = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, playlistResult, "Video removed from playlist successfully"));
});

const togglePlaylistVisibility = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }
  playlist.isPublic = !playlist.isPublic;
  await playlist.save();
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist visibility toggled successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  togglePlaylistVisibility,
};
