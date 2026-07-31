import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getUserChannelProfile } from "../api/user.api";
import { getAllVideos } from "../api/video.api";
import { getUserPlaylists } from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import { formatViews } from "../lib/formatters";
import SubscribeButton from "../components/channel/SubscribeButton";
import VideoGrid from "../components/video/VideoGrid";
import PlaylistCard from "../components/playlist/PlaylistCard";

const PAGE_SIZE = 20;

export default function ChannelPage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("videos");

  const {
    data: channel,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["channel", username],
    queryFn: () => getUserChannelProfile(username),
    enabled: !!username,
  });

  const isOwnChannel = currentUser?._id === channel?._id;

  const {
    data: videos,
    isLoading: videosLoading,
    isPlaceholderData,
    isError: videosIsError,
    error: videosError,
  } = useQuery({
    queryKey: ["videos", "channel", channel?._id, page],
    queryFn: () => getAllVideos({ userId: channel._id, page, limit: PAGE_SIZE }),
    enabled: !!channel?._id && tab === "videos",
    placeholderData: keepPreviousData,
  });

  const {
    data: playlists,
    isLoading: playlistsLoading,
    isError: playlistsIsError,
    error: playlistsError,
  } = useQuery({
    queryKey: ["playlists", "channel", channel?._id],
    queryFn: () => getUserPlaylists(channel._id),
    enabled: !!channel?._id && tab === "playlists",
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 sm:h-48 rounded-lg bg-neutral-800" />
        <div className="flex items-center gap-4 mt-4">
          <div className="w-20 h-20 rounded-full bg-neutral-800 shrink-0" />
          <div className="space-y-2">
            <div className="h-5 bg-neutral-800 rounded w-48" />
            <div className="h-3.5 bg-neutral-800 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-400 text-sm">
        Couldn&apos;t load this channel:{" "}
        {error?.response?.data?.message || error?.message}
      </p>
    );
  }

  if (!channel) return null;

  return (
    <div>
      <div className="h-32 sm:h-48 rounded-lg bg-neutral-900 overflow-hidden">
        {channel.coverImage && (
          <img
            src={channel.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-4">
          {channel.avatar ? (
            <img
              src={channel.avatar}
              alt={channel.username}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-neutral-700 shrink-0 flex items-center justify-center text-2xl font-medium">
              {channel.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold">{channel.fullName}</h1>
            <p className="text-sm text-neutral-500">@{channel.username}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {formatViews(channel.subscribers).replace("view", "subscriber")}
            </p>
          </div>
        </div>

        {!isOwnChannel && (
          <SubscribeButton
            channelId={channel._id}
            isSubscribed={channel.isSubscribed}
            queryKey={["channel", channel.username]}
            updateFn={(old, { isSubscribed, delta }) =>
              old ? { ...old, isSubscribed, subscribers: old.subscribers + delta } : old
            }
          />
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold mb-4 text-neutral-300">Videos</h2>

        <VideoGrid
          videos={videos?.docs}
          isLoading={videosLoading}
          isError={videosIsError}
          error={videosError}
        />

        {videos && videos.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!videos.hasPrevPage}
              className="rounded-md px-4 py-1.5 text-sm border border-neutral-700 hover:bg-neutral-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Previous
            </button>

            <span className="text-sm text-neutral-400">
              Page {videos.page} of {videos.totalPages}
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!videos.hasNextPage || isPlaceholderData}
              className="rounded-md px-4 py-1.5 text-sm border border-neutral-700 hover:bg-neutral-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
