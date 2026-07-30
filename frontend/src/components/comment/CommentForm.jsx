import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { createComment } from "../../api/comment.api";

export default function CommentForm({ videoId, queryKey }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: (text) => createComment(videoId, text),
    onSuccess: () => {
      setContent("");
      // Simplest correct approach: refetch. The new comment needs
      // isLiked/likesCount/owner shape that only the aggregation
      // pipeline produces, so we can't just splice the raw create
      // response into the cache — let the server tell us the truth.
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate(content.trim());
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
          placeholder="Add a comment..."
          rows={2}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-brand"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!content.trim() || mutation.isPending}
            className="rounded-md bg-brand hover:bg-brand-light px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? "Posting..." : "Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}
