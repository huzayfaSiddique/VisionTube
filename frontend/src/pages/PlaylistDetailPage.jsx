import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Globe, Pencil, Trash2 } from "lucide-react";
import {
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  togglePlaylistVisibility,
} from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import PlaylistVideoRow from "../components/playlist/PlaylistVideoRow";

export default function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryKey = ["playlist", playlistId];

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: playlist, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getPlaylistById(playlistId),
    enabled: !!playlistId,
  });

  // react-query v5 dropped onSuccess/onError from useQuery, so the edit
  // form's local state is seeded here once the playlist has loaded.
  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description);
    }
  }, [playlist]);

  const isOwner = user?._id === playlist?.owner?._id;

  const updateMutation = useMutation({
    mutationFn: () => updatePlaylist(playlistId, { name, description }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, (old) =>
        old ? { ...old, name: updated.name, description: updated.description } : old
      );
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlaylist(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", user?._id] });
      navigate("/playlists");
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: () => togglePlaylistVisibility(playlistId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old ? { ...old, isPublic: !old.isPublic } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", user?._id] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 bg-neutral-800 rounded w-1/3" />
        <div className="h-4 bg-neutral-800 rounded w-1/2" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-400 text-sm">
        Couldn&apos;t load this playlist:{" "}
        {error?.response?.data?.message || error?.message}
      </p>
    );
  }

  if (!playlist) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        {isEditing ? (
          <div className="space-y-2 max-w-sm">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand"
              placeholder="Playlist name"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand"
              placeholder="Description"
            />
            {updateMutation.isError && (
              <p className="text-xs text-red-400">
                {updateMutation.error?.response?.data?.message || "Update failed"}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!name.trim() || !description.trim() || updateMutation.isPending}
                className="rounded-md bg-brand hover:bg-brand-light px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setName(playlist.name);
                  setDescription(playlist.description);
                }}
                className="rounded-md px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              {!playlist.isPublic && <Lock size={16} className="text-neutral-500" />}
              {playlist.name}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">{playlist.description}</p>
            <Link
              to={`/c/${playlist.owner?.username}`}
              className="text-xs text-neutral-500 hover:text-neutral-300 mt-1 inline-block"
            >
              {playlist.owner?.fullName} · {playlist.videos.length}{" "}
              {playlist.videos.length === 1 ? "video" : "videos"}
            </Link>

            {isOwner && (
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => visibilityMutation.mutate()}
                  disabled={visibilityMutation.isPending}
                  title={playlist.isPublic ? "Make private" : "Make public"}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 disabled:opacity-50"
                >
                  {playlist.isPublic ? (
                    <>
                      <Globe size={13} /> Public
                    </>
                  ) : (
                    <>
                      <Lock size={13} /> Private
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
                >
                  <Pencil size={13} /> Edit
                </button>
                {confirmingDelete ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400">Delete playlist?</span>
                    <button
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:underline"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="text-neutral-400 hover:underline"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {playlist.videos.length === 0 ? (
        <p className="text-neutral-500 text-sm">No videos in this playlist yet.</p>
      ) : (
        <div>
          {playlist.videos.map((video) => (
            <PlaylistVideoRow
              key={video._id}
              video={video}
              playlistId={playlistId}
              isOwner={isOwner}
              queryKey={queryKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}
