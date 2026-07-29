import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Like } from "../models/like.models.js";
import { Tweet } from "../models/tweets.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import mongoose from "mongoose";

// toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const like = await Like.findOne({
    owner: req.user?._id,
    video: videoId,
  });
  if (like) {
    await Like.findByIdAndDelete(like._id);
  } else {
    await Like.create({
      owner: req.user?._id,
      video: videoId,
    });
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked: !like },
        "Video like toggled successfully"
      )
    );
});

// toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  const like = await Like.findOne({
    owner: req.user?._id,
    comment: commentId,
  });
  if (like) {
    await Like.findByIdAndDelete(like._id);
  } else {
    await Like.create({
      owner: req.user?._id,
      comment: commentId,
    });
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked: !like },
        "Comment like toggled successfully"
      )
    );
});

// get liked videos of a user
const getUserLikedVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const likedVideos = await Like.aggregate([
    // 1. Match likes by this user where 'video' field exists
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        video: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "videoDetails.owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        _id: "$videoDetails._id",
        title: "$videoDetails.title",
        thumbnail: "$videoDetails.thumbnail",
        duration: "$videoDetails.duration",
        views: "$videoDetails.views",
        createdAt: "$videoDetails.createdAt",
        owner: {
          _id: "$ownerDetails._id",
          username: "$ownerDetails.username",
          fullName: "$ownerDetails.fullName",
          avatar: "$ownerDetails.avatar",
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideos,
        "User liked videos fetched successfully"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  const like = await Like.findOne({
    owner: req.user?._id,
    tweet: tweetId,
  });
  if (like) {
    await Like.findByIdAndDelete(like._id);
  } else {
    await Like.create({
      owner: req.user?._id,
      tweet: tweetId,
    });
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked: !like },
        "Tweet like toggled successfully"
      )
    );
});

// get liked tweets of a user
const getUserLikedTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const likedTweets = await Like.aggregate([
    // 1. Match likes by this user where 'tweet' field exists
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        tweet: { $exists: true , $ne: null},
      },
    },
    // 2. Join with 'tweets' collection
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweetDetails",
      },
    },
    // 3. Convert tweetDetails array to an object
    {
      $unwind: "$tweetDetails",
    },
    // 4. Join tweet's owner with 'users' collection
    {
      $lookup: {
        from: "users",
        localField: "tweetDetails.owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    // 5. Convert ownerDetails array to an object
    {
      $unwind: "$ownerDetails",
    },
    // 6. Project (shape) the final output response
    {
      $project: {
        _id: "$tweetDetails._id",
        content: "$tweetDetails.content",
        createdAt: "$tweetDetails.createdAt",
        owner: {
          _id: "$ownerDetails._id",
          username: "$ownerDetails.username",
          fullName: "$ownerDetails.fullName",
          avatar: "$ownerDetails.avatar",
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedTweets,
        "User liked tweets fetched successfully"
      )
    );
});
export {
  toggleVideoLike,
  toggleCommentLike,
  getUserLikedVideos,
  toggleTweetLike,
  getUserLikedTweets,
};
