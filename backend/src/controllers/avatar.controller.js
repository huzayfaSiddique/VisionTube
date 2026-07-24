import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

const getPublicIdFromUrl = (url) => {
  return url.split("/").pop().split(".")[0];
};

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const oldAvatar = req.user?.avatar;
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

   if (oldAvatar) {
        const oldPublicId = getPublicIdFromUrl(oldAvatar);
        await deleteFromCloudinary(oldPublicId);
    }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const deleteAvatar = asyncHandler(async (req, res) => {
  if (!req.user?.avatar) {
    throw new ApiError(404, "No avatar found");
  }

  const deletedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        avatar: 1,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, deletedUser, "Avatar deleted successfully"));
});
export { updateAvatar, deleteAvatar };
