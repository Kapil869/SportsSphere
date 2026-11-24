import ArticleGrid from '../components/ArticleGrid.jsx';
import { EmptyState, ErrorState, Notice, SkeletonGrid } from '../components/States.jsx';

/** Shared body for category and search pages: loading, error, empty, grid and "Load more". */
export default function NewsList({ list, emptyTitle, emptyText, emptyAction }) {
  const { articles, loading, loadingMore, error, loadMoreError, hasMore, loadMore, reload, meta } = list;

  if (loading) return <SkeletonGrid count={9} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (articles.length === 0) {
    return <EmptyState title={emptyTitle} action={emptyAction}>{emptyText}</EmptyState>;
  }

  return (
    <>
      {meta?.stale && <Notice>Live updates are paused, so these are stories we saved earlier.</Notice>}
      <ArticleGrid articles={articles} />
      <div className="more">
        {loadMoreError && <p className="more__error" role="alert">{loadMoreError.message}</p>}
        {(hasMore || loadMoreError) && (
          <button type="button" className="btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading more stories' : loadMoreError ? 'Try again' : 'Load more stories'}
          </button>
        )}
      </div>
    </>
  );
}
