import { Link } from "react-router-dom";
import { VideoOff } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <VideoOff size={48} className="text-neutral-600 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="rounded-md px-4 py-2 text-sm border border-neutral-700 hover:bg-neutral-900 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
