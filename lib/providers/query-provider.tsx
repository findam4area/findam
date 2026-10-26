"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * TanStack Query Provider
 * Provides React Query client for data fetching, caching, and state management
 * 
 * Configuration based on Requirements 29.1-29.9:
 * - Retry logic with exponential backoff (29.7)
 * - Stale time of 5 minutes for listings (29.3)
 * - Query placeholders for stale data (29.9)
 * - Hierarchical query key structure (29.2)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes for listings (Requirement 29.3)
            staleTime: 5 * 60 * 1000, // 5 minutes
            
            // Garbage collection time: keep unused data for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            
            // Don't refetch on window focus to reduce unnecessary requests
            refetchOnWindowFocus: false,
            
            // Retry logic with exponential backoff (Requirement 29.7)
            retry: (failureCount, error) => {
              // Don't retry on 4xx client errors
              if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) return false;
              }
              // Retry up to 3 times for network/server errors
              return failureCount < 3;
            },
            
            // Exponential backoff: 1s, 2s, 4s (Requirement 29.7)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Use placeholders to show stale data while refetching (Requirement 29.9)
            placeholderData: (previousData: unknown) => previousData,
          },
          mutations: {
            // Retry mutations once on network errors
            retry: (failureCount, error) => {
              if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                // Don't retry client errors
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
