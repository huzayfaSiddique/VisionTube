import { Link } from "react-router-dom";
import { formatDuration, formatViews, timeAgo } from "../../lib/formatters";

export default function VideoCard({ video }) {
  const { _id, title, thumbnail, duration, views, createdAt, owner } = video;

  return (
    <div className="group">
      <Link to={`/watch/${_id}`} className="block">
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
      </Link>

      <div className="flex gap-3 mt-3">
        <Link to={`/c/${owner?.username}`} className="shrink-0">
          {owner?.avatar ? (
            <img
              src={owner.avatar}
              alt={owner.username}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium">
              {owner?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </Link>

        <div className="min-w-0">
          <Link to={`/watch/${_id}`}>
            <h3 className="text-sm font-medium leading-snug line-clamp-2 hover:text-neutral-300">
              {title}
            </h3>
          </Link>
          <Link to={`/c/${owner?.username}`} className="text-xs text-neutral-400 mt-1 truncate block hover:text-neutral-300">
            {owner?.fullName ?? owner?.username}
          </Link>
          <p className="text-xs text-neutral-500">
            {formatViews(views)} · {timeAgo(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
