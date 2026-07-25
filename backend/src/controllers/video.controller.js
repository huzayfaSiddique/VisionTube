import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getPublicIdFromUrl } from "../utils/publicIdfromURL.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }


  const videoLocalPath = req.files?.video?.[0]?.path;
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
    .json(new ApiResponse(201, createdVideo, "Video created successfully"));
});

const deleteVideo= asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
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


  if (oldVideo) {
    const oldPublicId = getPublicIdFromUrl(oldVideo);
    await deleteFromCloudinary(oldPublicId, "video"); // ← Must specify "video" type!
  }
  if (oldThumbnail) {
    const oldThumbnailPublicId = getPublicIdFromUrl(oldThumbnail);
    await deleteFromCloudinary(oldThumbnailPublicId); // thumbnail is an image (default)
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

export { uploadVideo, deleteVideo };