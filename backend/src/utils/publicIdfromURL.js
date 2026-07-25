import { ApiError } from "./apiError.js";
const getPublicIdFromUrl = (url) => {
  try {
    if (!url) {
      throw new ApiError(400, "URL is required");
    }
    return url.split("/").pop().split(".")[0];
  } catch (error) {
    throw new ApiError(400, "Error while extracting Public ID from URL");
  }
};

export { getPublicIdFromUrl };