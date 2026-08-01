import { useState } from "react";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { toggleTweetLike } from "../../api/like.api";
import { updateTweet, deleteTweet } from "../../api/tweet.api";
import { timeAgo } from "../../lib/formatters";

const MAX_LENGTH = 280;

// queryKey's cache is a flat array of tweets (unlike comments, which are paginated).
function mapTweetInList(oldData, tweetId, updater) {
  if (!oldData) return oldData;
  return oldData.map((t) => (t._id === tweetId ? updater(t) : t));
}

function removeTweetFromList(oldData, tweetId) {
  if (!oldData) return oldData;
  return oldData.filter((t) => t._id !== tweetId);
}

export default function TweetItem({ tweet, queryKey }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?._id === tweet.owner?._id;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tweet.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => toggleTweetLike(tweet._id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        mapTweetInList(old, tweet._id, (t) => ({
          ...t,
          isLiked: !t.isLiked,
          likesCount: t.isLiked ? t.likesCount - 1 : t.likesCount + 1,
        }))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (content) => updateTweet(tweet._id, content),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, (old) =>
        mapTweetInList(old, tweet._id, (t) => ({
          ...t,
          content: updated.content,
          updatedAt: updated.updatedAt,
        }))
      );
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTweet(tweet._id),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (old) =>
        removeTweetFromList(old, tweet._id)
      );
    },
  });

  return (
    <div className="flex gap-3 py-4 border-b border-neutral-800 last:border-b-0">
      {tweet.owner?.avatar ? (
        <img
          src={tweet.owner.avatar}
          alt={tweet.owner.username}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-neutral-700 shrink-0 flex items-center justify-center text-xs font-medium">
          {tweet.owner?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">@{tweet.owner?.username}</span>
          <span className="text-xs text-neutral-500">
            {timeAgo(tweet.createdAt)}
            {tweet.updatedAt !== tweet.createdAt && " (edited)"}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={2}
              maxLength={MAX_LENGTH}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate(editValue.trim())}
                disabled={!editValue.trim() || updateMutation.isPending}
                className="rounded-md bg-brand hover:bg-brand-light px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(tweet.content);
                }}
                className="rounded-md px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">
            {tweet.content}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1 text-xs ${
              tweet.isLiked ? "text-brand-light" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Heart size={13} fill={tweet.isLiked ? "currentColor" : "none"} />
            {tweet.likesCount > 0 && tweet.likesCount}
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
