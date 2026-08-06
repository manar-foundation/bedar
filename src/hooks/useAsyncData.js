import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Load data for a screen, with reload and optimistic local edits.
 *
 * WHY NOT `setLoading(true)` IN AN EFFECT
 * ----------------------------------------------------------------
 * ESLint enforces `react-hooks/set-state-in-effect` in this project,
 * and the rule is right: an effect that immediately sets state runs
 * a whole extra render pass with stale data on screen, and in a
 * transition it tears. So the loading state is the INITIAL state,
 * and a changed `key` resets it during render — the documented
 * "adjust state when props change" pattern — instead of after.
 *
 * `key` is whatever identifies the request (a route param, a
 * collection name, a filter). It is compared by `Object.is`, so pass
 * a string, not an object literal.
 *
 *   const { data, loading, error, reload } = useAsyncData(
 *     () => listItems(collection),
 *     collection,
 *   );
 */
export function useAsyncData(loader, key = 'default') {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [activeKey, setActiveKey] = useState(key);
  const [nonce, setNonce] = useState(0);

  // Render-phase reset: a new key means the data on screen belongs
  // to the previous one and must not be shown for another frame.
  if (!Object.is(activeKey, key)) {
    setActiveKey(key);
    setState({ status: 'loading', data: null, error: null });
  }

  // The loader closes over props and is a new function every render.
  // Keeping it in a ref is what lets the fetch effect depend on the
  // key alone instead of re-firing on every parent render.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;

    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  /**
   * Patch the loaded data without a round trip — for the very common
   * "the row I just saved came back from the server" case. Re-fetching
   * a whole list to move one badge is a visible flash of the table.
   */
  const setData = useCallback((next) => {
    setState((previous) =>
      previous.status === 'ready'
        ? { ...previous, data: typeof next === 'function' ? next(previous.data) : next }
        : previous,
    );
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: state.status === 'loading',
    ready: state.status === 'ready',
    reload,
    setData,
  };
}

export default useAsyncData;
