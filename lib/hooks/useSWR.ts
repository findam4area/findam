/**
 * SWR (Stale-While-Revalidate) hook for data fetching with caching
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Cache } from "@/lib/utils/cache";

interface UseSWROptions<T> {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  refreshInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseSWRReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T, revalidate?: boolean) => Promise<void>;
  revalidate: () => Promise<void>;
}

const fetcherCache = new Map<string, Promise<any>>();

export function useSWR<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseSWROptions<T> = {},
): UseSWRReturn<T> {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000,
    refreshInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const lastFetchTime = useRef<number>(0);
  const refreshIntervalId = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!key) return;

      // Deduping: prevent multiple fetches within dedupingInterval
      const now = Date.now();
      if (now - lastFetchTime.current < dedupingInterval && !skipCache) {
        return;
      }

      try {
        setIsValidating(true);

        // Check if there's an ongoing fetch for this key
        let fetchPromise = fetcherCache.get(key);

        if (!fetchPromise || skipCache) {
          // Try to get from cache first
          if (!skipCache) {
            const cached = await Cache.get<T>(key);
            if (cached) {
              setData(cached);
              setIsLoading(false);
              // Continue to revalidate in background
            }
          }

          // Fetch fresh data
          fetchPromise = fetcher();
          fetcherCache.set(key, fetchPromise);

          // Clean up after fetch completes
          fetchPromise.finally(() => {
            setTimeout(() => {
              fetcherCache.delete(key);
            }, dedupingInterval);
          });
        }

        const result = await fetchPromise;
        setData(result);
        setError(null);
        lastFetchTime.current = Date.now();

        // Cache the result
        await Cache.set(key, result);

        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [key, fetcher, dedupingInterval, onSuccess, onError],
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    refreshIntervalId.current = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => {
      if (refreshIntervalId.current) {
        clearInterval(refreshIntervalId.current);
      }
    };
  }, [refreshInterval, fetchData]);

  // Mutate function to update data manually
  const mutate = useCallback(
    async (newData?: T, revalidate = true) => {
      if (newData !== undefined) {
        setData(newData);
        if (key) {
          await Cache.set(key, newData);
        }
      }

      if (revalidate) {
        await fetchData(true);
      }
    },
    [key, fetchData],
  );

  // Revalidate function
  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    revalidate,
  };
}
