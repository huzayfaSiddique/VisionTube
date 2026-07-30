import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getVideoById } from "../api/video.api";
import { formatViews, timeAgo } from "../lib/formatters";
import LikeButton from "../components/video/LikeButton";
import CommentSection from "../components/comment/CommentSection";

export default function WatchPage() {
  const { videoId } = useParams();

  const { data: video, isLoading, isError, error } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => getVideoById(videoId),
    enabled: !!videoId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="aspect-video rounded-lg bg-neutral-800" />
        <div className="h-5 bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-800 rounded w-1/3" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-400 text-sm">
        Couldn&apos;t load this video:{" "}
        {error?.response?.data?.message || error?.message}
      </p>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          key={video._id}
          src={video.videoFile}
          poster={video.thumbnail}
          controls
          className="w-full h-full"
        />
      </div>

      <h1 className="text-lg font-semibold mt-4">{video.title}</h1>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {video.owner?.avatar ? (
            <img
              src={video.owner.avatar}
              alt={video.owner.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-medium">
              {video.owner?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{video.owner?.fullName}</p>
            <p className="text-xs text-neutral-500">@{video.owner?.username}</p>
          </div>
          {/* Subscribe button comes in Step 6 */}
        </div>

        <LikeButton
          videoId={video._id}
          isLiked={video.isLiked}
          likesCount={video.likesCount}
        />
      </div>

      <div className="mt-4 rounded-lg bg-neutral-900 p-3">
        <p className="text-xs text-neutral-400 mb-2">
          {formatViews(video.views)} · {timeAgo(video.createdAt)}
        </p>
        <p className="text-sm text-neutral-200 whitespace-pre-wrap">
          {video.description}
        </p>
      </div>

      <CommentSection videoId={video._id} />
    </div>
  );
}
