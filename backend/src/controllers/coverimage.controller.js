import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { getPublicIdFromUrl } from "../controllers/avatar.controller.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const oldCoverImage = req.user?.coverImage;

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(400, "Cover image upload failed");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (oldCoverImage) {
    const oldPublicId = getPublicIdFromUrl(oldCoverImage);
    await deleteFromCloudinary(oldPublicId);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "cover image updated successfully")
    );
});

const deleteCoverImage = asyncHandler(async (req, res) => {
  const oldCoverImage = req.user?.coverImage;

  if (!oldCoverImage) {
    throw new ApiError(404, "No cover image found");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        coverImage: 1,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (oldCoverImage) {
    const oldPublicId = getPublicIdFromUrl(oldCoverImage);
    await deleteFromCloudinary(oldPublicId);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "cover image deleted successfully")
    );
});

export { updateCoverImage, deleteCoverImage };
