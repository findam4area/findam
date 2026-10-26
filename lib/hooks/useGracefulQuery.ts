/**
 * Custom hook for TanStack Query with graceful degradation
 * Automatically handles cache fallbacks and retry logic
 */

import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  fetchWithCacheFallback,
  retryWithBackoff,
  getCachedData,
} from "@/lib/errors/graceful-degradation";
import { trackError } from "@/lib/errors";

interface GracefulQueryOptions<TData> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  cacheKey?: string;
  cacheTTL?: number;
  enableCacheFallback?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  staleTime?: number;
  enabled?: boolean;
}

interface GracefulQueryResult<TData> {
  data: TData | undefined;
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  status: 'error' | 'success' | 'pending';
  refetch: () => void;
  isFromCache: boolean;
  isStale: boolean;
}

/**
 * Enhanced useQuery with graceful degradation
 */
export function useGracefulQuery<TData = unknown>(
  options: GracefulQueryOptions<TData>,
): GracefulQueryResult<TData> {
  const {
    queryFn,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    enableCacheFallback = true,
    enableRetry = true,
    maxRetries = 3,
    ...queryOptions
  } = options;

  const [isFromCache, setIsFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Wrap query function with graceful degradation
  const enhancedQueryFn = async (): Promise<TData> => {
    if (enableCacheFallback && cacheKey) {
      const { data, fromCache } = await fetchWithCacheFallback(
        enableRetry
          ? () => retryWithBackoff(queryFn, { maxRetries })
          : queryFn,
        {
          key: cacheKey,
          ttl: cacheTTL,
        },
      );

      setIsFromCache(fromCache);
      setIsStale(fromCache);

      return data;
    } else if (enableRetry) {
      return retryWithBackoff(queryFn, { maxRetries });
    } else {
      return queryFn();
    }
  };

  const queryResult = useQuery({
    ...queryOptions,
    queryFn: enhancedQueryFn,
    retry: false, // We handle retries ourselves
  });

  // Check if cached data is stale on mount
  useEffect(() => {
    if (enableCacheFallback && cacheKey && !queryResult.data) {
      const cached = getCachedData({ key: cacheKey, ttl: cacheTTL });
      if (cached) {
        setIsStale(true);
      }
    }
  }, [cacheKey, cacheTTL, enableCacheFallback, queryResult.data]);

  return {
    ...queryResult,
    isFromCache,
    isStale,
  };
}

/**
 * Hook for handling realtime subscriptions with polling fallback
 */
export function useRealtimeWithFallback<TData>(
  subscriptionFn: (callback: (data: TData) => void) => () => void,
  pollingFn: () => Promise<TData>,
  options: {
    pollingInterval?: number;
    onData?: (data: TData) => void;
    onError?: (error: Error) => void;
  } = {},
) {
  const { pollingInterval = 30000, onData, onError } = options;
  const [isUsingPolling, setIsUsingPolling] = useState(false);
  const [data, setData] = useState<TData | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let pollingIntervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Try to establish realtime subscription
    try {
      unsubscribe = subscriptionFn((newData) => {
        if (isMounted) {
          setData(newData);
          onData?.(newData);
          setIsUsingPolling(false);
        }
      });
    } catch (error) {
      console.warn("Realtime subscription failed, falling back to polling:", error);
      trackError(error as Error, {
        tags: { fallback: "polling" },
      });
      setIsUsingPolling(true);
    }

    // Set up polling fallback
    if (isUsingPolling) {
      const poll = async () => {
        try {
          const newData = await pollingFn();
          if (isMounted) {
            setData(newData);
            onData?.(newData);
          }
        } catch (error) {
          console.warn("Polling failed:", error);
          onError?.(error as Error);
        }
      };

      // Poll immediately
      poll();

      // Then poll at intervals
      pollingIntervalId = setInterval(poll, pollingInterval);
    }

    return () => {
      isMounted = false;
      unsubscribe?.();
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [subscriptionFn, pollingFn, pollingInterval, onData, onError, isUsingPolling]);

  return {
    data,
    isUsingPolling,
  };
}
