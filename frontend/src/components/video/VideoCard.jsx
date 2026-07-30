import { Link } from "react-router-dom";
import { formatDuration, formatViews, timeAgo } from "../../lib/formatters";

export default function VideoCard({ video }) {
  const { _id, title, thumbnail, duration, views, createdAt, owner } = video;

  return (
    <Link to={`/watch/${_id}`} className="block group">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          loading="lazy"
        />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-xs px-1.5 py-0.5 rounded">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex gap-3 mt-3">
        {owner?.avatar ? (
          <img
            src={owner.avatar}
            alt={owner.username}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-neutral-700 shrink-0 flex items-center justify-center text-xs font-medium">
            {owner?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-sm font-medium leading-snug line-clamp-2">
            {title}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 truncate">
            {owner?.fullName ?? owner?.username}
          </p>
          <p className="text-xs text-neutral-500">
            {formatViews(views)} · {timeAgo(createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
