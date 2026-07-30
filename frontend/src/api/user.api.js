import axiosClient from "./axiosClient";

// Returns: { _id, username, fullName, avatar, coverImage, subscribers,
// subscribedTo, isSubscribed, ...rest of user fields minus password/refreshToken }
export const getUserChannelProfile = async (username) => {
  const res = await axiosClient.get(`/users/c/${username}`);
  return res.data.data;
};
