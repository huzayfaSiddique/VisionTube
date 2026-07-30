import VideoCard from "./VideoCard";

export default function VideoGrid({ videos, isLoading, isError, error }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video rounded-lg bg-neutral-800" />
            <div className="flex gap-3 mt-3">
              <div className="w-9 h-9 rounded-full bg-neutral-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-neutral-800 rounded w-4/5" />
                <div className="h-3 bg-neutral-800 rounded w-2/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-400 text-sm">
        Couldn&apos;t load videos: {error?.response?.data?.message || error?.message}
      </p>
    );
  }

  if (!videos || videos.length === 0) {
    return <p className="text-neutral-500 text-sm">No videos yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}
