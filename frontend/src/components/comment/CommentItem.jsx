import { useState } from "react";
import { ThumbsUp, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { toggleCommentLike } from "../../api/like.api";
import { updateComment, deleteComment } from "../../api/comment.api";
import { timeAgo } from "../../lib/formatters";

// Helper: walk an infinite-query's `{ pages: [...] }` shape and apply
// `updater` to the one comment matching commentId, wherever its page is.
function mapCommentInPages(oldData, commentId, updater) {
  if (!oldData) return oldData;
  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      docs: page.docs.map((c) => (c._id === commentId ? updater(c) : c)),
    })),
  };
}

function removeCommentFromPages(oldData, commentId) {
  if (!oldData) return oldData;
  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      docs: page.docs.filter((c) => c._id !== commentId),
      totalDocs: page.totalDocs - 1,
    })),
  };
}

export default function CommentItem({ comment, queryKey }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?._id === comment.owner?._id;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => toggleCommentLike(comment._id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        mapCommentInPages(old, comment._id, (c) => ({
          ...c,
          isLiked: !c.isLiked,
          likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1,
        }))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (content) => updateComment(comment._id, content),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, (old) =>
        mapCommentInPages(old, comment._id, (c) => ({
          ...c,
          content: updated.content,
          updatedAt: updated.updatedAt,
        }))
      );
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment._id),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (old) =>
        removeCommentFromPages(old, comment._id)
      );
    },
  });

  return (
    <div className="flex gap-3">
      {comment.owner?.avatar ? (
        <img
          src={comment.owner.avatar}
          alt={comment.owner.username}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-neutral-700 shrink-0 flex items-center justify-center text-xs font-medium">
          {comment.owner?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            @{comment.owner?.username}
          </span>
          <span className="text-xs text-neutral-500">
            {timeAgo(comment.createdAt)}
            {comment.updatedAt !== comment.createdAt && " (edited)"}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={2}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate(editValue)}
                disabled={!editValue.trim() || updateMutation.isPending}
                className="rounded-md bg-brand hover:bg-brand-light px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(comment.content);
                }}
                className="rounded-md px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1 text-xs ${
              comment.isLiked ? "text-brand-light" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <ThumbsUp size={13} fill={comment.isLiked ? "currentColor" : "none"} />
            {comment.likesCount > 0 && comment.likesCount}
          </button>

          {isOwner && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
              >
                <Pencil size={13} />
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
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
