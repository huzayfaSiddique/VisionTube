import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import { Tweet } from "../models/tweets.models.js";
import { Subscription } from "../models/subscription.models.js";
import { sendConfirmationEmail } from "../utils/sendEmail.js";
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation
  // check if user already exists : database check for email and username
  // check for avatar and cover images if available and upload to cloudinary
  // check avatar in cloudinary whether success upload otherwise send error
  // create user in db
  // remove password and refresh token from response
  // send response with user data

  const { username, email, fullName, password } = req.body;

  if (
    [username, email, fullName, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const trimmedUsername = username.trim().toLowerCase();
  const trimmedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
  });

  if (existingUser) {
    if (existingUser.username === trimmedUsername) {
      throw new ApiError(409, "User with this username already exists");
    }
    if (existingUser.email === trimmedEmail) {
      throw new ApiError(409, "User with this email address already exists");
    }
    throw new ApiError(409, "User with this username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Generate verification token (expires in 24 hours)
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const lastEmailSentAt = new Date();

  const user = await User.create({
    username: trimmedUsername,
    email: trimmedEmail,
    fullName: fullName.trim(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    emailVerificationToken,
    emailVerificationTokenExpiry,
    isEmailVerified: false,
    lastEmailSentAt,
  });

  const createdUser = await User.findById(user._id).select(
    " -password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  // Construct confirmation redirect URL
  const serverPort = process.env.PORT || 8000;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${serverPort}`;
  const confirmationUrl = `${serverUrl}/api/v1/users/confirm-email?token=${emailVerificationToken}`;

  // Send confirmation email in background (non-blocking)
  setImmediate(() => {
    sendConfirmationEmail({
      email: user.email,
      username: user.username,
      confirmationUrl,
    }).catch((err) =>
      console.error("Background registration email dispatch failed:", err)
    );
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registered successfully. Confirmation email sent!"
      )
    );
});

// Hoisted to module scope: both loginUser and refreshAccessToken need this.
const accessTokenandrefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error Generating JWT tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || !email.trim() || !password.trim()) {
    throw new ApiError(400, "Both email and password are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await accessTokenandrefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
          loggedInUser,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }, // cleaner method to remove field from db than setting to null or undefined
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  if (user?.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid Refresh token!");
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await accessTokenandrefreshToken(user._id);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, newRefreshToken },
        "Access token Refreshed successfully"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Current Password!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select(" -password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required!");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // Computed first, in its own stage, so it reads the raw `subscribers`
      // array (subscription docs) before the next stage collapses it to a count.
      $addFields: {
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $addFields: {
        subscribers: {
          $size: "$subscribers",
        },
        subscribedTo: {
          $size: "$subscribedTo",
        },
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "User Channel not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
});

const getWatchedHistory = asyncHandler(async (req, res) => {
  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $unwind: "$watchHistory",
    },
    {
      $sort: {
        "watchHistory.watchedAt": -1,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory.video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        "watchHistory.videoDetails": { $first: "$videoDetails" },
      },
    },
    {
      $group: {
        _id: "$_id",
        watchHistory: { $push: "$watchHistory" },
      },
    },
  ]);
  // An empty history is a valid state (e.g. a brand-new account), not an
  // error — the $match/$unwind pipeline simply yields no group in that
  // case, so just return an empty array instead of 404ing.
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        watchHistory[0]?.watchHistory || [],
        "Watch History fetched successfully"
      )
    );
});

const removeFromWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $pull: { watchHistory: { video: videoId } } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Removed from watch history"));
});

const clearWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { watchHistory: [] } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Watch history cleared"));
});

const getlatesttweetsofsubscribedchannels = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  // 1. Fetch channel IDs that the logged-in user is subscribed to
  const subscriptions = await Subscription.find({ subscriber: userId }).select("channel");
  const channelIds = subscriptions.map((sub) => sub.channel);
  if (!channelIds.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No tweets found (no subscriptions)"));
  }
  // 2. Query tweets created by those channels in the last 24 hours using $in and $gte
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tweets = await Tweet.find({
    owner: { $in: channelIds },
    createdAt: { $gte: twentyFourHoursAgo },
  })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        tweets,
        "Latest tweets of subscribed channels fetched successfully"
      )
    );
});
const confirmEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const clientUrl =
    process.env.CORS_ORIGIN || process.env.CLIENT_URL || "http://localhost:5173";

  if (!token) {
    return res.redirect(`${clientUrl}/login?error=invalid_token`);
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.redirect(`${clientUrl}/login?error=invalid_or_expired_token`);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Redirect user to frontend confirm-email-success page
  return res.redirect(`${clientUrl}/confirm-email-success`);
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No account found with this email address");
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Your email address is already verified!"));
  }

  // Enforce 30-second rate-limiting cooldown
  const COOLDOWN_SECONDS = 30;
  if (user.lastEmailSentAt) {
    const timePassedMs = Date.now() - new Date(user.lastEmailSentAt).getTime();
    const cooldownMs = COOLDOWN_SECONDS * 1000;
    if (timePassedMs < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - timePassedMs) / 1000);
      throw new ApiError(
        429,
        `Please wait ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""} before requesting another confirmation email.`
      );
    }
  }

  // Generate fresh token and update lastEmailSentAt
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationTokenExpiry = emailVerificationTokenExpiry;
  user.lastEmailSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Construct confirmation redirect URL
  const serverPort = process.env.PORT || 8000;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${serverPort}`;
  const confirmationUrl = `${serverUrl}/api/v1/users/confirm-email?token=${emailVerificationToken}`;

  // Non-blocking background email dispatch
  setImmediate(() => {
    sendConfirmationEmail({
      email: user.email,
      username: user.username,
      confirmationUrl,
    }).catch((err) =>
      console.error("Background resend email dispatch failed:", err)
    );
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Confirmation email has been resent successfully. Please check your inbox!"
      )
    );
});

export {
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
};
