import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllVideos } from "../api/video.api";
import { useAuth } from "../context/AuthContext";
import StudioVideoRow from "../components/studio/StudioVideoRow";

const PAGE_SIZE = 10;

export default function StudioPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const queryKey = ["videos", "studio", user?._id, page];

  const { data, isLoading, isPlaceholderData, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      getAllVideos({
        userId: user._id,
        includeUnpublished: "true",
        page,
        limit: PAGE_SIZE,
      }),
    enabled: !!user?._id,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Studio · Your videos</h1>
        <Link
          to="/upload"
          className="rounded-md bg-brand hover:bg-brand-light transition-colors px-4 py-1.5 text-sm font-medium"
        >
          Upload
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-40 aspect-video rounded-md bg-neutral-800 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-neutral-800 rounded w-2/3" />
                <div className="h-3 bg-neutral-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-red-400 text-sm">
          Couldn&apos;t load your videos:{" "}
          {error?.response?.data?.message || error?.message}
        </p>
      )}

      {data && data.docs.length === 0 && (
        <p className="text-neutral-500 text-sm">
          You haven&apos;t uploaded any videos yet.{" "}
          <Link to="/upload" className="text-brand-light hover:underline">
            Upload your first one
          </Link>
          .
        </p>
      )}

      {data && data.docs.length > 0 && (
        <div>
          {data.docs.map((video) => (
            <StudioVideoRow key={video._id} video={video} queryKey={queryKey} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
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
