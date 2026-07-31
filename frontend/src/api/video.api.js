import axiosClient from "./axiosClient";

// GET /videos supports: page, limit, query (search), sortBy, sortType, userId,
// includeUnpublished ("true" — only honored by the backend when userId is
// also your own id; used by Studio to show drafts).
export const getAllVideos = async (params = {}) => {
  const res = await axiosClient.get("/videos", { params });
  return res.data.data;
};

export const getVideoById = async (videoId) => {
  const res = await axiosClient.get(`/videos/${videoId}`);
  return res.data.data;
};

// formData: title, description, videoFile (file), thumbnail (file)
export const uploadVideo = async (formData, { onUploadProgress } = {}) => {
  const res = await axiosClient.post("/videos/publish-video", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data.data;
};

// fields: { title?, description?, thumbnail? (file) }
export const updateVideo = async (videoId, fields) => {
  const formData = new FormData();
  if (fields.title !== undefined) formData.append("title", fields.title);
  if (fields.description !== undefined)
    formData.append("description", fields.description);
  if (fields.thumbnail) formData.append("thumbnail", fields.thumbnail);

  const res = await axiosClient.patch(`/videos/update/${videoId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const deleteVideo = async (videoId) => {
  const res = await axiosClient.delete(`/videos/delete/${videoId}`);
  return res.data.data;
};

// Returns the updated video (isPublished flipped).
export const togglePublishStatus = async (videoId) => {
  const res = await axiosClient.patch(`/videos/publish/${videoId}`);
  return res.data.data;
};
