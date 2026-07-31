import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllVideos } from "../api/video.api";
import VideoGrid from "../components/video/VideoGrid";

const PAGE_SIZE = 20;

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const { data, isLoading, isPlaceholderData, isError, error } = useQuery({
    queryKey: ["videos", "search", query, page],
    queryFn: () => getAllVideos({ query, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    enabled: query.length > 0,
  });

  if (!query) {
    return <p className="text-neutral-500 text-sm">Type something to search for videos.</p>;
  }

  return (
    <div>
      <p className="text-sm text-neutral-400 mb-4">
        Search results for <span className="text-neutral-200">&quot;{query}&quot;</span>
      </p>

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
