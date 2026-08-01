import { useQuery } from "@tanstack/react-query";
import { getUserTweets } from "../../api/tweet.api";
import TweetForm from "./TweetForm";
import TweetItem from "./TweetItem";

export default function TweetSection({ channelId, isOwnChannel }) {
  const queryKey = ["tweets", channelId];

  const { data: tweets, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getUserTweets(channelId),
    enabled: !!channelId,
  });

  return (
    <div>
      {isOwnChannel && <TweetForm queryKey={queryKey} />}

      {isLoading && (
        <p className="text-sm text-neutral-500">Loading tweets...</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Couldn&apos;t load tweets: {error?.response?.data?.message || error?.message}
        </p>
      )}

      {!isLoading && !isError && tweets?.length === 0 && (
        <p className="text-sm text-neutral-500">
          {isOwnChannel
            ? "You haven't tweeted anything yet."
            : "This channel hasn't tweeted anything yet."}
        </p>
      )}

      {tweets && tweets.length > 0 && (
        <div>
          {tweets.map((tweet) => (
            <TweetItem key={tweet._id} tweet={tweet} queryKey={queryKey} />
          ))}
        </div>
      )}
    </div>
  );
}
