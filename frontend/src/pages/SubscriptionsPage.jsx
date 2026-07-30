import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSubscribedChannels } from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionsPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subscribed-channels", user?._id],
    queryFn: () => getSubscribedChannels(user._id),
    enabled: !!user?._id,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-neutral-800" />
            <div className="h-3 bg-neutral-800 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-400 text-sm">
        Couldn&apos;t load your subscriptions:{" "}
        {error?.response?.data?.message || error?.message}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-neutral-500 text-sm">
        You haven&apos;t subscribed to any channels yet.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Subscriptions</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {data.map(({ channel }) => (
          <Link
            key={channel._id}
            to={`/c/${channel.username}`}
            className="flex flex-col items-center gap-2 text-center group"
          >
            {channel.avatar ? (
              <img
                src={channel.avatar}
                alt={channel.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center text-xl font-medium">
                {channel.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate group-hover:underline">
                {channel.fullName}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                @{channel.username}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
