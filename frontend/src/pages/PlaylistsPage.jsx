import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { getUserPlaylists } from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import PlaylistCard from "../components/playlist/PlaylistCard";
import CreatePlaylistForm from "../components/playlist/CreatePlaylistForm";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryKey = ["playlists", user?._id];

  const { data: playlists, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getUserPlaylists(user._id),
    enabled: !!user?._id,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Your playlists</h1>
        <button
          onClick={() => setShowCreateForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-md bg-brand hover:bg-brand-light transition-colors px-4 py-1.5 text-sm font-medium"
        >
          <Plus size={16} />
          New playlist
        </button>
      </div>

      {showCreateForm && (
        <div className="max-w-sm mb-6 rounded-lg border border-neutral-800 p-4">
          <CreatePlaylistForm
            invalidateKeys={[queryKey]}
            onCreated={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-lg bg-neutral-800" />
              <div className="h-3.5 bg-neutral-800 rounded w-3/5 mt-3" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-red-400 text-sm">
          Couldn&apos;t load your playlists:{" "}
          {error?.response?.data?.message || error?.message}
        </p>
      )}

      {playlists && playlists.length === 0 && !showCreateForm && (
        <p className="text-neutral-500 text-sm">
          You don&apos;t have any playlists yet.
        </p>
      )}

      {playlists && playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist._id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}
