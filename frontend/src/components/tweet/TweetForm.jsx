import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { createTweet } from "../../api/tweet.api";

const MAX_LENGTH = 280;

export default function TweetForm({ queryKey }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: (text) => createTweet(text),
    onSuccess: () => {
      setContent("");
      // The create response doesn't carry likesCount/isLiked/owner the way
      // the aggregated list endpoint does, so just refetch the list.
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) return;
    mutation.mutate(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-neutral-700 shrink-0 flex items-center justify-center text-xs font-medium">
          {user?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          rows={2}
          maxLength={MAX_LENGTH}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs ${
              content.length > MAX_LENGTH ? "text-red-400" : "text-neutral-500"
            }`}
          >
            {content.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={
              !content.trim() ||
              content.length > MAX_LENGTH ||
              mutation.isPending
            }
            className="rounded-md bg-brand hover:bg-brand-light px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? "Posting..." : "Tweet"}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-xs text-red-400 mt-1">
            Couldn&apos;t post:{" "}
            {mutation.error?.response?.data?.message || mutation.error?.message}
          </p>
        )}
      </div>
    </form>
  );
}
