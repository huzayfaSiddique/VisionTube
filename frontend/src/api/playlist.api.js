import axiosClient from "./axiosClient";

export const createPlaylist = async ({ name, description }) => {
  const res = await axiosClient.post("/playlists", { name, description });
  return res.data.data;
};

// Returns: [{ _id, name, description, isPublic, videosCount, thumbnail,
// containsVideo? (only present when videoId is passed), ... }]
export const getUserPlaylists = async (userId, videoId) => {
  const res = await axiosClient.get(`/playlists/user/${userId}`, {
    params: videoId ? { videoId } : undefined,
  });
  return res.data.data;
};

// Returns a single playlist with `videos` populated (title, thumbnail,
// duration, views, createdAt, owner) and `owner` populated.
export const getPlaylistById = async (playlistId) => {
  const res = await axiosClient.get(`/playlists/${playlistId}`);
  return res.data.data;
};

export const updatePlaylist = async (playlistId, { name, description }) => {
  const res = await axiosClient.patch(
    `/playlists/update-playlist/${playlistId}`,
    { name, description }
  );
  return res.data.data;
};

export const deletePlaylist = async (playlistId) => {
  const res = await axiosClient.delete(
    `/playlists/delete-playlist/${playlistId}`
  );
  return res.data.data;
};

export const addVideoToPlaylist = async (videoId, playlistId) => {
  const res = await axiosClient.post(`/playlists/${videoId}/${playlistId}`);
  return res.data.data;
};

export const removeVideoFromPlaylist = async (videoId, playlistId) => {
  const res = await axiosClient.delete(`/playlists/${videoId}/${playlistId}`);
  return res.data.data;
};

// Flips isPublic on the server and returns the updated playlist.
export const togglePlaylistVisibility = async (playlistId) => {
  const res = await axiosClient.patch(`/playlists/toggle/${playlistId}`);
  return res.data.data;
};
