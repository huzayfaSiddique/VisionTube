import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlaylist } from "../../api/playlist.api";

// onCreated: optional callback fired with the new playlist after creation
// (used by SaveToPlaylistButton to immediately add the current video to it).
export default function CreatePlaylistForm({
  invalidateKeys = [],
  onCreated,
  onCancel,
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createPlaylist({ name: name.trim(), description: description.trim() }),
    onSuccess: (playlist) => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      setName("");
      setDescription("");
      onCreated?.(playlist);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Playlist name"
        className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand"
      />
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error?.response?.data?.message || "Couldn't create playlist"}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || !description.trim() || mutation.isPending}
          className="rounded-md bg-brand hover:bg-brand-light px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {mutation.isPending ? "Creating…" : "Create"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
