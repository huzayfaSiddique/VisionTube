import { useQuery } from "@tanstack/react-query";
import { getUserLikedVideos } from "../api/like.api";
import { useAuth } from "../context/AuthContext";
import VideoGrid from "../components/video/VideoGrid";

export default function LikedVideosPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["liked-videos", user?._id],
    queryFn: () => getUserLikedVideos(user._id),
    enabled: !!user?._id,
  });

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Liked videos</h1>
      <VideoGrid videos={data} isLoading={isLoading} isError={isError} error={error} />
    </div>
  );
}
