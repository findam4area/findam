"use client";

import { useEffect, useState } from "react";
import { fetchWithCacheFallback } from "@/lib/errors";
import { AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataWithCacheFallbackProps<T> {
  /**
   * Unique cache key for this data
   */
  cacheKey: string;

  /**
   * Function to fetch fresh data
   */
  fetchData: () => Promise<T>;

  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   */
  cacheTTL?: number;

  /**
   * Render function for the data
   */
  children: (data: T, isStale: boolean) => React.ReactNode;

  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Error component (when no cache available)
   */
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;

  /**
   * Show stale data warning
   */
  showStaleWarning?: boolean;
}

/**
 * Component that fetches data with automatic cache fallback
 * Implements Requirement 19.4: Display cached content when API fails
 */
export function DataWithCacheFallback<T>({
  cacheKey,
  fetchData,
  cacheTTL = 5 * 60 * 1000,
  children,
  loadingComponent,
  errorComponent,
  showStaleWarning = true,
}: DataWithCacheFallbackProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWithCacheFallback(fetchData, {
        key: cacheKey,
        ttl: cacheTTL,
      });

      setData(result.data);
      setIsFromCache(result.fromCache);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cacheKey]);

  if (isLoading && !data) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff41]" />
          </div>
        )}
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        {errorComponent ? (
          errorComponent(error, loadData)
        ) : (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Failed to load data
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    We couldn't fetch the latest data. Please try again.
                  </p>
                </div>
                <Button
                  onClick={loadData}
                  size="sm"
                  className="bg-[#00ff41] hover:bg-[#00cc33] text-black"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="relative">
      {isFromCache && showStaleWarning && (
        <div className="mb-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-500">
                Showing cached content
              </p>
              <p className="text-xs text-gray-400 mt-1">
                we're having trouble connecting to the server. This data may be outdated.
              </p>
            </div>
            <Button
              onClick={loadData}
              size="sm"
              variant="ghost"
              className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      )}
      {children(data, isFromCache)}
    </div>
  );
}
