import axiosClient from "./axiosClient";

// Each tweet: { _id, content, createdAt, updatedAt, likesCount, isLiked, owner }
export const getUserTweets = async (userId) => {
  const res = await axiosClient.get(`/tweets/user/${userId}`);
  return res.data.data;
};

export const createTweet = async (content) => {
  const res = await axiosClient.post(`/tweets`, { content });
  return res.data.data;
};

export const updateTweet = async (tweetId, content) => {
  const res = await axiosClient.patch(`/tweets/${tweetId}`, { content });
  return res.data.data;
};

export const deleteTweet = async (tweetId) => {
  const res = await axiosClient.delete(`/tweets/${tweetId}`);
  return res.data.data;
};
