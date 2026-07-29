import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }
  if (channelId.toString() === req.user?._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    subscribedTo: channelId,
  });

  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);
  } else {
    await Subscription.create({ subscriber: req.user._id, channel: channelId });
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed: !subscription },
        "Subscription toggled successfully"
      )
    );
});

// get all channels of a user who he has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  const subscriptions = await Subscription.find({
    subscriber: userId,
  }).populate("channel", "username avatar fullName");
  const formattedSubscriptions = subscriptions.map((sub) => ({
    channel: sub.channel,
  }));
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedSubscriptions,
        "Subscribed channels fetched successfully"
      )
    );
});

// get all subscribers of a channel
const getSubscribers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  const subscriptions = await Subscription.find({
    channel: userId,
  }).populate("subscriber", "username avatar fullName");
  const formattedSubscriptions = subscriptions.map((sub) => ({
    subscriber: sub.subscriber,
  }));
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedSubscriptions,
        "Subscribers fetched successfully"
      )
    );
});

const getUserSubscriptionStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: userId,
  });
  const isSubscribed = subscription ? true : false;
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        isSubscribed,
        "User subscription status fetched successfully"
      )
    );
});

const getChannelSubscribersCount = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }
  const subscriptions = await Subscription.countDocuments({
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Channel subscribers count fetched successfully"
      )
    );
});

export {
  toggleSubscription,
  getSubscribedChannels,
  getSubscribers,
  getUserSubscriptionStatus,
  getChannelSubscribersCount,
};
