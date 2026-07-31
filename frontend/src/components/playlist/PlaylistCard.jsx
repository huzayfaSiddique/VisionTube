import { Link } from "react-router-dom";
import { ListVideo, Lock } from "lucide-react";

export default function PlaylistCard({ playlist }) {
  const { _id, name, videosCount, thumbnail, isPublic } = playlist;

  return (
    <Link to={`/playlist/${_id}`} className="block group">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900 flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            loading="lazy"
          />
        ) : (
          <ListVideo size={28} className="text-neutral-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
          <ListVideo size={12} />
          {videosCount}
        </span>
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-medium leading-snug line-clamp-1 flex items-center gap-1.5">
          {!isPublic && <Lock size={12} className="text-neutral-500 shrink-0" />}
          {name}
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          {videosCount} {videosCount === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}
