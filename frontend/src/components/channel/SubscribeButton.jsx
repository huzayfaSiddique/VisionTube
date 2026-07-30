import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleSubscription } from "../../api/subscription.api";

// Generic subscribe/unsubscribe button. The caller tells it which
// react-query cache entry to optimistically update and how, since
// different pages store the channel's subscription data in different
// shapes (ChannelPage: top-level `{ isSubscribed, subscribers }`;
// WatchPage: nested under `video.owner.{isSubscribed,subscribers}`).
//
// updateFn(oldData, { isSubscribed, delta }) => newData
//   - called with the OPTIMISTIC guess on mutate (delta = +1/-1)
//   - called again with the CONFIRMED server value on success (delta = 0),
//     so the count isn't double-adjusted, only isSubscribed is reconciled.
export default function SubscribeButton({
  channelId,
  isSubscribed,
  queryKey,
  updateFn,
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleSubscription(channelId),

    onMutate: async () => {
      if (!queryKey || !updateFn) return {};
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
        updateFn(old, {
          isSubscribed: !isSubscribed,
          delta: isSubscribed ? -1 : 1,
        })
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (queryKey && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSuccess: (data) => {
      if (!queryKey || !updateFn) return;
      queryClient.setQueryData(queryKey, (old) =>
        updateFn(old, { isSubscribed: data.isSubscribed, delta: 0 })
      );
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        isSubscribed
          ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
          : "bg-neutral-100 hover:bg-white text-neutral-900"
      }`}
    >
      {isSubscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
