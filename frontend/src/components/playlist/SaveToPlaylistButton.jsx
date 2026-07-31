import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListPlus, Plus, Lock } from "lucide-react";
import {
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from "../../api/playlist.api";
import { useAuth } from "../../context/AuthContext";
import CreatePlaylistForm from "./CreatePlaylistForm";

// "Save" button on WatchPage. Opens a dropdown of the current user's
// playlists with a checkbox per playlist (checked = video is already in
// it), plus an inline "new playlist" form. Only fetches the playlist list
// once the dropdown is actually opened, since most video views never touch it.
export default function SaveToPlaylistButton({ videoId }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  // Scoped by videoId too — this cache entry carries a per-video
  // `containsVideo` flag the plain ["playlists", userId] list doesn't have.
  const queryKey = ["playlists", user?._id, videoId];

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const { data: playlists, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getUserPlaylists(user._id, videoId),
    enabled: isOpen && !!user?._id,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ playlistId, contains }) =>
      contains
        ? removeVideoFromPlaylist(videoId, playlistId)
        : addVideoToPlaylist(videoId, playlistId),

    onMutate: async ({ playlistId, contains }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old
          ? old.map((p) =>
              p._id === playlistId
                ? {
                    ...p,
                    containsVideo: !contains,
                    videosCount: p.videosCount + (contains ? -1 : 1),
                  }
                : p
            )
          : old
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },

    // The plain (no videoId) playlists list on PlaylistsPage shows
    // videosCount/thumbnail too — that's now stale, so refresh it.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", user?._id] });
    },
  });

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border border-neutral-700 hover:bg-neutral-900 transition-colors"
      >
        <ListPlus size={16} />
        Save
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl z-20 p-3">
          <p className="text-xs font-medium text-neutral-400 px-1 mb-2">
            Save to playlist
          </p>

          {isLoading && <p className="text-xs text-neutral-500 px-1">Loading…</p>}

          {isError && (
            <p className="text-xs text-red-400 px-1">
              {error?.response?.data?.message || "Couldn't load playlists"}
            </p>
          )}

          {playlists && playlists.length === 0 && !showCreateForm && (
            <p className="text-xs text-neutral-500 px-1 mb-2">No playlists yet.</p>
          )}

          {playlists && playlists.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5 mb-2">
              {playlists.map((playlist) => (
                <label
                  key={playlist._id}
                  className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-neutral-900 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={playlist.containsVideo}
                    disabled={toggleMutation.isPending}
                    onChange={() =>
                      toggleMutation.mutate({
                        playlistId: playlist._id,
                        contains: playlist.containsVideo,
                      })
                    }
                    className="accent-brand shrink-0"
                  />
                  {!playlist.isPublic && (
                    <Lock size={11} className="text-neutral-500 shrink-0" />
                  )}
                  <span className="truncate flex-1">{playlist.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="border-t border-neutral-800 pt-2">
            {showCreateForm ? (
              <CreatePlaylistForm
                invalidateKeys={[["playlists", user?._id]]}
                onCreated={(playlist) => {
                  // Seed this dropdown's cache with the new playlist, then
                  // add the current video to it right away.
                  queryClient.setQueryData(queryKey, (old) => [
                    { ...playlist, videosCount: 0, thumbnail: null, containsVideo: false },
                    ...(old ?? []),
                  ]);
                  toggleMutation.mutate({ playlistId: playlist._id, contains: false });
                  setShowCreateForm(false);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 text-sm text-brand-light hover:underline px-1"
              >
                <Plus size={15} />
                New playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
