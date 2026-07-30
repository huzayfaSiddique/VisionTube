import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllVideos } from "../api/video.api";
import VideoGrid from "../components/video/VideoGrid";

const PAGE_SIZE = 20;

export default function HomePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData, isError, error } = useQuery({
    queryKey: ["videos", "home", page],
    queryFn: () => getAllVideos({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData, // keep old page's videos on screen while the next page loads
  });

  return (
    <div>
      <VideoGrid
        videos={data?.docs}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.hasPrevPage}
            className="rounded-md px-4 py-1.5 text-sm border border-neutral-700 hover:bg-neutral-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Previous
          </button>

          <span className="text-sm text-neutral-400">
            Page {data.page} of {data.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNextPage || isPlaceholderData}
            className="rounded-md px-4 py-1.5 text-sm border border-neutral-700 hover:bg-neutral-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
