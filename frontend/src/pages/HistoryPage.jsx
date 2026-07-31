import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWatchedHistory,
  removeFromWatchHistory,
  clearWatchHistory,
} from "../api/user.api";
import { formatDuration, timeAgo } from "../lib/formatters";

const HISTORY_KEY = ["watch-history"];

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: HISTORY_KEY,
    queryFn: getWatchedHistory,
  });

  const removeMutation = useMutation({
    mutationFn: (videoId) => removeFromWatchHistory(videoId),
    onSuccess: (_data, videoId) => {
      queryClient.setQueryData(HISTORY_KEY, (old) =>
        (old || []).filter((entry) => entry.video !== videoId)
      );
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearWatchHistory,
    onSuccess: () => {
      queryClient.setQueryData(HISTORY_KEY, []);
      setConfirmingClear(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-40 aspect-video rounded-md bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 bg-neutral-800 rounded w-4/5" />
              <div className="h-3 bg-neutral-800 rounded w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-400 text-sm">
        Couldn&apos;t load your watch history:{" "}
        {error?.response?.data?.message || error?.message}
      </p>
    );
  }

  const history = data || [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Watch history</h1>

        {history.length > 0 &&
          (confirmingClear ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">Clear all history?</span>
              <button
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="text-red-400 hover:underline"
              >
                {clearMutation.isPending ? "Clearing…" : "Yes"}
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                className="text-neutral-400 hover:underline"
              >
                No
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmingClear(true)}
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              Clear all
            </button>
          ))}
      </div>

      {history.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          Videos you watch will show up here.
        </p>
      ) : (
        <div>
          {history.map((entry) => {
            const video = entry.videoDetails;
            if (!video) return null;
            return (
              <div
                key={`${entry.video}-${entry.watchedAt}`}
                className="group flex gap-4 py-3 border-b border-neutral-800 last:border-0"
              >
                <Link
                  to={`/watch/${video._id}`}
                  className="relative w-40 shrink-0 aspect-video rounded-md overflow-hidden bg-neutral-900"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </span>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/watch/${video._id}`}>
                    <h3 className="text-sm font-medium hover:text-neutral-300 line-clamp-2">
                      {video.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-neutral-500 mt-1">
                    {video.owner?.fullName}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Watched {timeAgo(entry.watchedAt)}
                  </p>
                </div>

                <button
                  onClick={() => removeMutation.mutate(entry.video)}
                  disabled={removeMutation.isPending}
                  aria-label="Remove from history"
                  title="Remove from history"
                  className="self-start text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
