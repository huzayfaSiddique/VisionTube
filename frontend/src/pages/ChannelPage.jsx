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
import TweetSection from "../components/tweet/TweetSection";

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
        <div className="flex items-center gap-1 border-b border-neutral-800 mb-6">
          <button
            onClick={() => setTab("videos")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "videos"
                ? "border-brand text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setTab("playlists")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "playlists"
                ? "border-brand text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setTab("tweets")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "tweets"
                ? "border-brand text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Tweets
          </button>
        </div>

        {tab === "videos" && (
          <>
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
          </>
        )}

        {tab === "tweets" && (
          <TweetSection channelId={channel._id} isOwnChannel={isOwnChannel} />
        )}

        {tab === "playlists" && (
          <>
            {playlistsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-video rounded-lg bg-neutral-800" />
                    <div className="h-3.5 bg-neutral-800 rounded w-3/5 mt-3" />
                  </div>
                ))}
              </div>
            )}

            {playlistsIsError && (
              <p className="text-red-400 text-sm">
                Couldn&apos;t load playlists:{" "}
                {playlistsError?.response?.data?.message || playlistsError?.message}
              </p>
            )}

            {playlists && playlists.length === 0 && (
              <p className="text-neutral-500 text-sm">
                {isOwnChannel
                  ? "You don't have any playlists yet."
                  : "This channel doesn't have any public playlists yet."}
              </p>
            )}

            {playlists && playlists.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist._id} playlist={playlist} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
