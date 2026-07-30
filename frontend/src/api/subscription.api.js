import axiosClient from "./axiosClient";

// Returns { isSubscribed } — the NEW state after toggling.
export const toggleSubscription = async (channelId) => {
  const res = await axiosClient.post(`/subscriptions/${channelId}`);
  return res.data.data;
};

// Channels the given user has subscribed to.
// Returns: [{ channel: { _id, username, fullName, avatar } }, ...]
export const getSubscribedChannels = async (userId) => {
  const res = await axiosClient.get(`/subscriptions/subscribed-channels/${userId}`);
  return res.data.data;
};
