import axiosClient from "./axiosClient";

// Returns: { _id, username, fullName, avatar, coverImage, subscribers,
// subscribedTo, isSubscribed, ...rest of user fields minus password/refreshToken }
export const getUserChannelProfile = async (username) => {
  const res = await axiosClient.get(`/users/c/${username}`);
  return res.data.data;
};

// Returns an array of { video, watchedAt, videoDetails }, newest first.
export const getWatchedHistory = async () => {
  const res = await axiosClient.get("/users/watched-history");
  return res.data.data;
};

export const removeFromWatchHistory = async (videoId) => {
  const res = await axiosClient.delete(`/users/watched-history/${videoId}`);
  return res.data.data;
};

export const clearWatchHistory = async () => {
  const res = await axiosClient.delete("/users/watched-history");
  return res.data.data;
};

// avatarFile: File. Returns the updated user.
export const updateAvatar = async (avatarFile, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);
  const res = await axiosClient.patch("/users/update-avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data.data;
};

// coverImageFile: File. Returns the updated user.
export const updateCoverImage = async (
  coverImageFile,
  { onUploadProgress } = {}
) => {
  const formData = new FormData();
  formData.append("coverImage", coverImageFile);
  const res = await axiosClient.patch("/users/update-coverimage", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data.data;
};

// Returns the updated user (coverImage unset).
export const deleteCoverImage = async () => {
  const res = await axiosClient.delete("/users/delete-coverimage");
  return res.data.data;
};
