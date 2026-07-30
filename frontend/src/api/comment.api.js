import axiosClient from "./axiosClient";

// Returns a mongoose-aggregate-paginate-v2 shaped result:
// { docs, totalDocs, page, totalPages, hasNextPage, ... }
// Each doc: { _id, content, createdAt, updatedAt, likesCount, isLiked, owner }
export const getVideoComments = async (videoId, params = {}) => {
  const res = await axiosClient.get(`/comments/${videoId}`, { params });
  return res.data.data;
};

export const createComment = async (videoId, content) => {
  const res = await axiosClient.post(`/comments/${videoId}`, { content });
  return res.data.data;
};

export const updateComment = async (commentId, content) => {
  const res = await axiosClient.patch(`/comments/${commentId}`, { content });
  return res.data.data;
};

export const deleteComment = async (commentId) => {
  const res = await axiosClient.delete(`/comments/${commentId}`);
  return res.data.data;
};
