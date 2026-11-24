import { useCallback, useEffect, useState } from 'react';
import { isCancelled, toApiError } from '../api/client.js';

/** Runs loader(signal) when deps change. Returns { data, error, loading, reload }. */
export function useFetch(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: null, loading: true });
    loader(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((err) => {
        if (isCancelled(err)) return;
        setState({ data: null, error: toApiError(err), loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
