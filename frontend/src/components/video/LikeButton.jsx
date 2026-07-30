import { ThumbsUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleVideoLike } from "../../api/like.api";

export default function LikeButton({ videoId, isLiked, likesCount }) {
  const queryClient = useQueryClient();
  const queryKey = ["video", videoId];

  const mutation = useMutation({
    mutationFn: () => toggleVideoLike(videoId),

    // Optimistic update: flip the UI immediately, don't wait on the network.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousVideo = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
        old
          ? {
              ...old,
              isLiked: !old.isLiked,
              likesCount: old.isLiked
                ? old.likesCount - 1
                : old.likesCount + 1,
            }
          : old
      );

      return { previousVideo };
    },

    // Roll back on failure.
    onError: (_err, _vars, context) => {
      if (context?.previousVideo) {
        queryClient.setQueryData(queryKey, context.previousVideo);
      }
    },

    // Reconcile with the server's actual isLiked value either way
    // (our local count math is a guess; isLiked itself we can trust).
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, (old) =>
        old ? { ...old, isLiked: data.isLiked } : old
      );
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border transition-colors disabled:opacity-60 ${
        isLiked
          ? "bg-neutral-100 text-neutral-900 border-neutral-100"
          : "border-neutral-700 hover:bg-neutral-900"
      }`}
    >
      <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
      {likesCount}
    </button>
  );
}
