'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  enabled?: boolean;
  skipInitial?: boolean;
}

export function useApiQuery<T>(fetcher: (() => Promise<T>) | null, options: Options = {}) {
  const { enabled = true, skipInitial = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skipInitial);
  const [error, setError] = useState<string | null>(null);
  
  // Store fetcher in a ref to avoid infinite re-renders
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    const currentFetcher = fetcherRef.current;
    if (!enabled || !currentFetcher) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await currentFetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!skipInitial) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { data, loading, error, reload: run };
}

