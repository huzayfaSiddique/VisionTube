import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../../api/video.api";
import { formatDuration, formatViews, timeAgo } from "../../lib/formatters";

// Helper: find & replace one video across a paginated docs[] cache, or
// remove it entirely.
function mapVideoInDocs(oldData, videoId, updater) {
  if (!oldData) return oldData;
  return {
    ...oldData,
    docs: oldData.docs.map((v) => (v._id === videoId ? updater(v) : v)),
  };
}

function removeVideoFromDocs(oldData, videoId) {
  if (!oldData) return oldData;
  return {
    ...oldData,
    docs: oldData.docs.filter((v) => v._id !== videoId),
    totalDocs: oldData.totalDocs - 1,
  };
}

export default function StudioVideoRow({ video, queryKey }) {
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const publishMutation = useMutation({
    mutationFn: () => togglePublishStatus(video._id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        mapVideoInDocs(old, video._id, (v) => ({
          ...v,
          isPublished: !v.isPublished,
        }))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateVideo(video._id, { title, description, thumbnail: thumbnailFile }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, (old) =>
        mapVideoInDocs(old, video._id, (v) => ({
          ...v,
          title: updated.title,
          description: updated.description,
          thumbnail: updated.thumbnail,
        }))
      );
      setIsEditing(false);
      setThumbnailFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVideo(video._id),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (old) =>
        removeVideoFromDocs(old, video._id)
      );
    },
  });

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-800 last:border-0">
      <Link to={`/watch/${video._id}`} className="relative w-40 shrink-0 aspect-video rounded-md overflow-hidden bg-neutral-900">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded">
          {formatDuration(video.duration)}
        </span>
      </Link>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1 text-sm focus:outline-none focus:border-brand"
              placeholder="Title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1 text-sm focus:outline-none focus:border-brand"
              placeholder="Description"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2 file:py-1 file:text-neutral-200 hover:file:bg-neutral-700"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!title.trim() || !description.trim() || updateMutation.isPending}
                className="rounded-md bg-brand hover:bg-brand-light px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTitle(video.title);
                  setDescription(video.description);
                  setThumbnailFile(null);
                }}
                className="rounded-md px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
              >
                Cancel
              </button>
              {updateMutation.isError && (
                <span className="text-xs text-red-400 self-center">
                  {updateMutation.error?.response?.data?.message || "Update failed"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <Link to={`/watch/${video._id}`}>
              <h3 className="text-sm font-medium hover:text-neutral-300 line-clamp-1">
                {video.title}
              </h3>
            </Link>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
              {video.description}
            </p>
            <p className="text-xs text-neutral-500 mt-1.5">
              {formatViews(video.views)} · {timeAgo(video.createdAt)}
            </p>
          </>
        )}

        {!isEditing && (
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className={`text-xs px-2 py-0.5 rounded-full border ${
                video.isPublished
                  ? "border-green-700 text-green-400 hover:bg-green-950"
                  : "border-neutral-600 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {video.isPublished ? "Published" : "Draft"}
            </button>

            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
            >
              <Pencil size={13} /> Edit
            </button>

            {confirmingDelete ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400">Delete?</span>
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
      </div>
    </div>
  );
}
