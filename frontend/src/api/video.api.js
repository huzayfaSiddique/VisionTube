import axiosClient from "./axiosClient";

// GET /videos supports: page, limit, query (search), sortBy, sortType, userId
// Returns a mongoose-aggregate-paginate-v2 shaped result:
// { docs, totalDocs, limit, totalPages, page, hasPrevPage, hasNextPage, ... }
export const getAllVideos = async (params = {}) => {
  const res = await axiosClient.get("/videos", { params });
  return res.data.data;
};

export const getVideoById = async (videoId) => {
  const res = await axiosClient.get(`/videos/${videoId}`);
  return res.data.data;
};
