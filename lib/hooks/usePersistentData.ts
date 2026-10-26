"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Hook to ensure data changes persist immediately
 * Provides optimistic updates with automatic retry on failure
 */
export function usePersistentData<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: {
    debounceMs?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    retryAttempts?: number;
  } = {},
) {
  const { debounceMs = 500, onSuccess, onError, retryAttempts = 3 } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const lastDataRef = useRef<T>(data);

  useEffect(() => {
    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    lastDataRef.current = data;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save operation
    timeoutRef.current = setTimeout(async () => {
      await persistData(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs]);

  const persistData = async (dataToSave: T) => {
    try {
      await saveFn(dataToSave);
      retryCountRef.current = 0;
      onSuccess?.();
    } catch (error) {
      console.error("Failed to persist data:", error);

      // Retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        toast.warning(
          `Retrying save (${retryCountRef.current}/${retryAttempts})...`,
        );

        // Exponential backoff
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(() => persistData(dataToSave), delay);
      } else {
        retryCountRef.current = 0;
        onError?.(error as Error);
        toast.error("Failed to save changes. Please try again.");
      }
    }
  };

  return {
    persist: () => persistData(data),
  };
}

/**
 * Hook for immediate persistence without debouncing
 * Use for critical data that must be saved immediately
 */
export function useImmediatePersist<T>(
  saveFn: (data: T) => Promise<void>,
  options: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {},
) {
  const { onSuccess, onError } = options;

  const persist = async (data: T) => {
    try {
      await saveFn(data);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to persist data immediately:", error);
      onError?.(error as Error);
      toast.error("Failed to save changes");
      throw error;
    }
  };

  return { persist };
}

/**
 * Hook for batch persistence
 * Collects multiple changes and persists them together
 */
export function useBatchPersist<T>(
  saveFn: (items: T[]) => Promise<void>,
  options: {
    batchSize?: number;
    flushIntervalMs?: number;
    onSuccess?: (count: number) => void;
    onError?: (error: Error) => void;
  } = {},
) {
  const {
    batchSize = 10,
    flushIntervalMs = 5000,
    onSuccess,
    onError,
  } = options;

  const batchRef = useRef<T[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Set up periodic flush
    intervalRef.current = setInterval(() => {
      if (batchRef.current.length > 0) {
        flush();
      }
    }, flushIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Flush remaining items on unmount
      if (batchRef.current.length > 0) {
        flush();
      }
    };
  }, []);

  const add = (item: T) => {
    batchRef.current.push(item);

    // Auto-flush if batch size reached
    if (batchRef.current.length >= batchSize) {
      flush();
    }
  };

  const flush = async () => {
    if (batchRef.current.length === 0) return;

    const itemsToSave = [...batchRef.current];
    batchRef.current = [];

    try {
      await saveFn(itemsToSave);
      onSuccess?.(itemsToSave.length);
    } catch (error) {
      console.error("Failed to persist batch:", error);
      onError?.(error as Error);
      // Re-add failed items to batch for retry
      batchRef.current.unshift(...itemsToSave);
    }
  };

  return { add, flush };
}
