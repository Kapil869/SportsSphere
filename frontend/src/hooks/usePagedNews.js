import { useCallback, useEffect, useRef, useState } from 'react';
import { isCancelled, toApiError } from '../api/client.js';

const INITIAL = { articles: [], hasMore: false, loading: true, loadingMore: false, error: null, loadMoreError: null, meta: null };

const merge = (current, incoming) => {
  const seen = new Set(current.map((a) => a.id));
  return [...current, ...incoming.filter((a) => !seen.has(a.id))];
};

/**
 * Paged article list. fetchPage(page, signal) must resolve to { articles, meta: { hasMore } }.
 * Resets and reloads whenever `deps` change; stale responses from a previous key are ignored.
 */
export function usePagedNews(fetchPage, deps) {
  const [state, setState] = useState(INITIAL);
  const [nonce, setNonce] = useState(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const pageRef = useRef(1);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const gen = ++generation.current;
    pageRef.current = 1;
    busy.current = false;
    setState(INITIAL);
    fetchRef
      .current(1, controller.signal)
      .then((res) => setState({ ...INITIAL, articles: res.articles, hasMore: !!res.meta?.hasMore, meta: res.meta, loading: false }))
      .catch((err) => {
        if (isCancelled(err) || gen !== generation.current) return;
        setState({ ...INITIAL, loading: false, error: toApiError(err) });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const gen = generation.current;
    const next = pageRef.current + 1;
    setState((s) => ({ ...s, loadingMore: true, loadMoreError: null }));
    try {
      const res = await fetchRef.current(next);
      if (gen !== generation.current) return;
      pageRef.current = next;
      setState((s) => ({
        ...s,
        articles: merge(s.articles, res.articles),
        hasMore: !!res.meta?.hasMore && res.articles.length > 0,
        loadingMore: false,
      }));
    } catch (err) {
      if (gen === generation.current) setState((s) => ({ ...s, loadingMore: false, loadMoreError: toApiError(err) }));
    } finally {
      busy.current = false;
    }
  }, []);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, loadMore, reload };
}
