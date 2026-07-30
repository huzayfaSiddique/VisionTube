import { useInfiniteQuery } from "@tanstack/react-query";
import { getVideoComments } from "../../api/comment.api";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

const PAGE_SIZE = 10;

export default function CommentSection({ videoId }) {
  const queryKey = ["comments", videoId];

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getVideoComments(videoId, { page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const comments = data?.pages.flatMap((page) => page.docs) ?? [];
  const totalCount = data?.pages[0]?.totalDocs ?? 0;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold mb-4">
        {totalCount} {totalCount === 1 ? "Comment" : "Comments"}
      </h2>

      <CommentForm videoId={videoId} queryKey={queryKey} />

      {isLoading && (
        <p className="text-sm text-neutral-500">Loading comments...</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Couldn&apos;t load comments: {error?.response?.data?.message || error?.message}
        </p>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="text-sm text-neutral-500">
          No comments yet — be the first to say something.
        </p>
      )}

      <div className="space-y-5">
        {comments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} queryKey={queryKey} />
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 text-sm text-brand-light hover:underline disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading..." : "Load more comments"}
        </button>
      )}
    </div>
  );
}
