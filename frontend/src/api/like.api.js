import axiosClient from "./axiosClient";

// Both return { isLiked } — the NEW state after toggling. Neither returns
// an updated count, so callers manage the count optimistically themselves.
export const toggleVideoLike = async (videoId) => {
  const res = await axiosClient.post(`/likes/video/${videoId}`);
  return res.data.data;
};

export const toggleCommentLike = async (commentId) => {
  const res = await axiosClient.post(`/likes/comment/${commentId}`);
  return res.data.data;
};

export const toggleTweetLike = async (tweetId) => {
  const res = await axiosClient.post(`/likes/tweet/${tweetId}`);
  return res.data.data;
};

export const getUserLikedVideos = async (userId) => {
  const res = await axiosClient.get(`/likes/liked-videos/${userId}`);
  return res.data.data;
};

export const getUserLikedTweets = async (userId) => {
  const res = await axiosClient.get(`/likes/liked-tweets/${userId}`);
  return res.data.data;
};
