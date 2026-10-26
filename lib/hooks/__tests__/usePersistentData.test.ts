import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  usePersistentData,
  useImmediatePersist,
  useBatchPersist,
} from "../usePersistentData";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("usePersistentData Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should debounce save operations", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    let data = { value: 1 };

    const { rerender } = renderHook(
      ({ data }) => usePersistentData(data, saveFn, { debounceMs: 100 }),
      { initialProps: { data } },
    );

    // Update data multiple times quickly
    data = { value: 2 };
    rerender({ data });

    data = { value: 3 };
    rerender({ data });

    data = { value: 4 };
    rerender({ data });

    // Should not have called saveFn yet
    expect(saveFn).not.toHaveBeenCalled();

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(1);
        expect(saveFn).toHaveBeenCalledWith({ value: 4 });
      },
      { timeout: 1000 },
    );
  });

  it("should call onSuccess callback", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    let data = { value: 1 };

    const { rerender } = renderHook(
      ({ data }) =>
        usePersistentData(data, saveFn, { onSuccess, debounceMs: 100 }),
      { initialProps: { data } },
    );

    data = { value: 2 };
    rerender({ data });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it("should retry on failure", async () => {
    const saveFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValueOnce(undefined);

    let data = { value: 1 };

    const { rerender } = renderHook(
      ({ data }) =>
        usePersistentData(data, saveFn, { retryAttempts: 3, debounceMs: 50 }),
      { initialProps: { data } },
    );

    data = { value: 2 };
    rerender({ data });

    // Wait for initial attempt and retries (with exponential backoff)
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(3);
      },
      { timeout: 15000 },
    );
  }, 20000); // Set test timeout to 20 seconds

  it("should call onError after max retries", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("Failed"));
    const onError = vi.fn();
    let data = { value: 1 };

    const { rerender } = renderHook(
      ({ data }) =>
        usePersistentData(data, saveFn, {
          retryAttempts: 2,
          onError,
          debounceMs: 50,
        }),
      { initialProps: { data } },
    );

    data = { value: 2 };
    rerender({ data });

    // Wait for all retries to complete
    await waitFor(
      () => {
        expect(onError).toHaveBeenCalled();
      },
      { timeout: 20000 },
    );
  }, 25000); // Set test timeout to 25 seconds

  it("should not save if data hasn't changed", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const data = { value: 1 };

    const { rerender } = renderHook(
      ({ data }) => usePersistentData(data, saveFn, { debounceMs: 100 }),
      { initialProps: { data } },
    );

    // Rerender with same data
    rerender({ data });

    // Wait a bit to ensure no save is triggered
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(saveFn).not.toHaveBeenCalled();
  });
});

describe("useImmediatePersist Hook", () => {
  it("should persist immediately without debouncing", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useImmediatePersist(saveFn));

    await act(async () => {
      await result.current.persist({ value: 1 });
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith({ value: 1 });
  });

  it("should call onSuccess callback", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useImmediatePersist(saveFn, { onSuccess }),
    );

    await act(async () => {
      await result.current.persist({ value: 1 });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should call onError on failure", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("Failed"));
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useImmediatePersist(saveFn, { onError }),
    );

    await expect(
      act(async () => {
        await result.current.persist({ value: 1 });
      }),
    ).rejects.toThrow("Failed");

    expect(onError).toHaveBeenCalled();
  });
});

describe("useBatchPersist Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should batch multiple items", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBatchPersist(saveFn, { batchSize: 3 }),
    );

    act(() => {
      result.current.add({ id: 1 });
      result.current.add({ id: 2 });
    });

    // Should not flush yet
    expect(saveFn).not.toHaveBeenCalled();

    await act(async () => {
      result.current.add({ id: 3 });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should auto-flush when batch size reached
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(1);
        expect(saveFn).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }, { id: 3 }]);
      },
      { timeout: 1000 },
    );
  });

  it("should flush on interval", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBatchPersist(saveFn, { flushIntervalMs: 500 }),
    );

    act(() => {
      result.current.add({ id: 1 });
      result.current.add({ id: 2 });
    });

    // Wait for interval to trigger flush
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
      },
      { timeout: 1000 },
    );
  });

  it("should manually flush", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useBatchPersist(saveFn));

    act(() => {
      result.current.add({ id: 1 });
      result.current.add({ id: 2 });
    });

    await act(async () => {
      await result.current.flush();
    });

    expect(saveFn).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  it("should call onSuccess with item count", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useBatchPersist(saveFn, { onSuccess, batchSize: 2 }),
    );

    await act(async () => {
      result.current.add({ id: 1 });
      result.current.add({ id: 2 });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalledWith(2);
      },
      { timeout: 1000 },
    );
  });

  it("should retry failed items", async () => {
    const saveFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useBatchPersist(saveFn, { batchSize: 2 }),
    );

    await act(async () => {
      result.current.add({ id: 1 });
      result.current.add({ id: 2 });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // First attempt fails
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 },
    );

    // Add another item to trigger retry
    await act(async () => {
      result.current.add({ id: 3 });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should retry with failed items plus new item
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(2);
      },
      { timeout: 1000 },
    );
  });
});
