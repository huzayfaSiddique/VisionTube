import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Like } from "../models/like.models.js";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getPublicIdFromUrl } from "../utils/publicIdfromURL.js";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }


  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail both are required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  if (!uploadedVideo?.url) {
    throw new ApiError(400, "Video upload failed");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new ApiError(400, "Thumbnail upload failed");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: uploadedVideo.url,
    thumbnail: thumbnail.url,
    duration: uploadedVideo.duration,
    owner: req.user?._id,
  });

  const createdVideo = await Video.findById(video._id);

  if (!createdVideo) {
    throw new ApiError(500, "Something went wrong while creating video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "Video uploaded successfully"));
});

// ─────────────────────────────────────────────
// 2. GET ALL VIDEOS (with pagination, search, sort)
// ─────────────────────────────────────────────
const getAllVideos = asyncHandler(async (req, res) => {
  // page: current page number, limit: videos per page
  // query: search term, sortBy: field to sort, sortType: asc/desc
  // userId: filter by a specific channel's videos
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    includeUnpublished,
  } = req.query;

  const pipeline = [];

  // Filter by search query on title or description
  if (query) {
    pipeline.push({ 
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  // Filter by specific channel/user
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }
    pipeline.push({
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    });
  }

  // Only return published videos — UNLESS the caller explicitly asked for
  // unpublished videos too (Studio's "My Videos") AND is the owner of that
  // catalog. This is opt-in so the public Channel page never leaks drafts,
  // even when you're the one viewing your own channel.
  const isOwnCatalog =
    userId && req.user?._id && userId === req.user._id.toString();

  if (!(includeUnpublished === "true" && isOwnCatalog)) {
    pipeline.push({ $match: { isPublished: true } });
  }

  // Sort stage
  pipeline.push({
    $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
  });

  // Populate owner details
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          { $project: { username: 1, fullName: 1, avatar: 1 } },
        ],
      },
    },
    {
      $addFields: { owner: { $first: "$owner" } },
    }
  );

  // Aggregate with pagination using the mongooseAggregatePaginate plugin
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

// ─────────────────────────────────────────────
// 3. GET VIDEO BY ID (increments views + adds to watchHistory)
// ─────────────────────────────────────────────
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  // Aggregate to get video with owner details
  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            // Computed first, in its own stage, so it reads the raw
            // `subscribers` array before the next stage collapses it to a count.
            $addFields: {
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [
                      req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null,
                      "$subscribers.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $addFields: {
              subscribers: { $size: "$subscribers" },
            },
          },
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribers: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: { owner: { $first: "$owner" } },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: {
          $in: [
            new mongoose.Types.ObjectId(req.user?._id),
            "$likes.owner",
          ],
        },
      },
    },
    {
      $project: { likes: 0 },
    },
  ]);

  if (!video?.length) {
    throw new ApiError(404, "Video not found");
  }

  // Unpublished videos are only accessible by their owner.
  // This check happens after the aggregate so we avoid a double DB query.
  if (
    !video[0].isPublished &&
    video[0].owner._id?.toString() !== req.user?._id?.toString()
  ) {
    throw new ApiError(403, "This video is not available");
  }

  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  await User.findByIdAndUpdate(req.user?._id, {
    $pull: { watchHistory: { video: videoId } },
  });
  await User.findByIdAndUpdate(req.user?._id, {
    $push: { watchHistory: { video: videoId, watchedAt: new Date() } },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

// ─────────────────────────────────────────────
// 4. UPDATE VIDEO (title, description, thumbnail)
// ─────────────────────────────────────────────
const updateVideoinfo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Only the owner can update
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized to update this video");
  }

  // Build update object with only provided fields
  const updateFields = {};
  if (title?.trim()) updateFields.title = title.trim();
  if (description?.trim()) updateFields.description = description.trim();

  // Handle optional thumbnail replacement
  const thumbnailLocalPath = req.file?.path;
  if (thumbnailLocalPath) {
    const oldThumbnailUrl = video.thumbnail;

    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!newThumbnail?.url) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    updateFields.thumbnail = newThumbnail.url;

    // Delete old thumbnail from Cloudinary
    if (oldThumbnailUrl) {
      const oldPublicId = getPublicIdFromUrl(oldThumbnailUrl);
      await deleteFromCloudinary(oldPublicId);
    }
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateFields },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// ─────────────────────────────────────────────
// 5. DELETE VIDEO
// ─────────────────────────────────────────────
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this video");
  }
  const oldVideo = video?.videoFile;
  const oldThumbnail = video?.thumbnail;

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(500, "Something went wrong while deleting video");
  }

  // Orphan Cleanup 1: Find comments on this video & delete them
  const comments = await Comment.find({ video: videoId });
  const commentIds = comments.map((comment) => comment._id);

  await Comment.deleteMany({ video: videoId });

  // Orphan Cleanup 2: Delete likes attached to this video & its comments
  await Like.deleteMany({
    $or: [
      { video: videoId },
      { comment: { $in: commentIds } },
    ],
  });

  // Orphan Cleanup 3: Pull video reference from any Playlists
  await Playlist.updateMany(
    { videos: videoId },
    { $pull: { videos: videoId } }
  );

  // Orphan Cleanup 4: Pull video reference from any User Watch History
  await User.updateMany(
    { "watchHistory.video": videoId },
    { $pull: { watchHistory: { video: videoId } } }
  );

  if (oldVideo) {
    const oldPublicId = getPublicIdFromUrl(oldVideo);
    await deleteFromCloudinary(oldPublicId, "video");
  }
  if (oldThumbnail) {
    const oldThumbnailPublicId = getPublicIdFromUrl(oldThumbnail);
    await deleteFromCloudinary(oldThumbnailPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Only the owner can toggle
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized to change publish status");
  }

  // Flip the isPublished boolean
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true }
  );

  const statusMessage = updatedVideo.isPublished
    ? "Video published successfully"
    : "Video unpublished successfully";

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, statusMessage));
});

export {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideoinfo,
  deleteVideo,
  togglePublishStatus,
};