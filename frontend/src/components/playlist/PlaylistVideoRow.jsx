import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeVideoFromPlaylist } from "../../api/playlist.api";
import { formatDuration, formatViews, timeAgo } from "../../lib/formatters";

export default function PlaylistVideoRow({ video, playlistId, isOwner, queryKey }) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: () => removeVideoFromPlaylist(video._id, playlistId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old
          ? { ...old, videos: old.videos.filter((v) => v._id !== video._id) }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  return (
    <div className="flex gap-4 py-3 border-b border-neutral-800 last:border-0 group">
      <Link
        to={`/watch/${video._id}`}
        className="relative w-40 shrink-0 aspect-video rounded-md overflow-hidden bg-neutral-900"
      >
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
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
        <p className="text-xs text-neutral-500 mt-1">{video.owner?.fullName}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {formatViews(video.views)} · {timeAgo(video.createdAt)}
        </p>
      </div>

      {isOwner && (
        <button
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          title="Remove from playlist"
          className="shrink-0 h-fit text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
