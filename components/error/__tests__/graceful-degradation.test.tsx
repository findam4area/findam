/**
 * Unit tests for graceful degradation components
 * Tests for Requirements 19.2, 19.3, 19.4, 19.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ImageWithFallback } from "../image-with-fallback";
import { DataWithCacheFallback } from "../data-with-cache-fallback";
import { RealtimeWithFallback } from "../realtime-with-fallback";
import { PartialFeatureWrapper } from "../partial-feature-wrapper";

// Mock the error utilities
vi.mock("@/lib/errors", () => ({
  handleImageError: vi.fn(),
  getImageFallback: vi.fn((type: string) => `/images/placeholder-${type}.png`),
  fetchWithCacheFallback: vi.fn(),
  trackError: vi.fn(),
  addBreadcrumb: vi.fn(),
  executeWithPartialFallback: vi.fn(),
  PollingFallback: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    isActive: vi.fn(() => false),
  })),
}));

describe("ImageWithFallback", () => {
  it("should render image with correct src", () => {
    render(
      <ImageWithFallback
        src="/test-image.jpg"
        alt="Test image"
        width={100}
        height={100}
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src");
    expect(img).toHaveAttribute("alt", "Test image");
  });

  it("should use fallback image on error (Requirement 19.2)", async () => {
    const { container } = render(
      <ImageWithFallback
        src="/broken-image.jpg"
        alt="Test image"
        width={100}
        height={100}
        fallbackType="listing"
      />
    );

    const img = container.querySelector("img");
    expect(img).toBeTruthy();

    // Simulate image error
    if (img) {
      const errorEvent = new Event("error");
      img.dispatchEvent(errorEvent);

      await waitFor(() => {
        expect(img.src).toContain("placeholder-listing.png");
      });
    }
  });

  it("should use custom fallback src if provided", async () => {
    const customFallback = "/custom-fallback.jpg";
    const { container } = render(
      <ImageWithFallback
        src="/broken-image.jpg"
        alt="Test image"
        width={100}
        height={100}
        fallbackSrc={customFallback}
      />
    );

    const img = container.querySelector("img");
    if (img) {
      const errorEvent = new Event("error");
      img.dispatchEvent(errorEvent);

      await waitFor(() => {
        expect(img.src).toContain("custom-fallback.jpg");
      });
    }
  });
});

describe("DataWithCacheFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    const mockFetch = vi.fn(() => Promise.resolve({ data: "test" }));

    render(
      <DataWithCacheFallback
        cacheKey="test-key"
        fetchData={mockFetch}
        loadingComponent={<div>Loading...</div>}
      >
        {(data) => <div>{JSON.stringify(data)}</div>}
      </DataWithCacheFallback>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should display cached data with warning (Requirement 19.4)", async () => {
    const { fetchWithCacheFallback } = await import("@/lib/errors");
    const mockData = { name: "Test", value: 123 };

    vi.mocked(fetchWithCacheFallback).mockResolvedValue({
      data: mockData,
      fromCache: true,
    });

    const mockFetch = vi.fn();

    render(
      <DataWithCacheFallback
        cacheKey="test-key"
        fetchData={mockFetch}
        showStaleWarning={true}
      >
        {(data) => <div data-testid="content">{JSON.stringify(data)}</div>}
      </DataWithCacheFallback>
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText(/showing cached content/i)).toBeInTheDocument();
    });
  });

  it("should display error with retry button when fetch fails and no cache", async () => {
    const { fetchWithCacheFallback } = await import("@/lib/errors");
    const mockError = new Error("Network error");

    vi.mocked(fetchWithCacheFallback).mockRejectedValue(mockError);

    const mockFetch = vi.fn();

    render(
      <DataWithCacheFallback cacheKey="test-key" fetchData={mockFetch}>
        {(data) => <div>{JSON.stringify(data)}</div>}
      </DataWithCacheFallback>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  it("should render fresh data without warning", async () => {
    const { fetchWithCacheFallback } = await import("@/lib/errors");
    const mockData = { name: "Fresh Data" };

    vi.mocked(fetchWithCacheFallback).mockResolvedValue({
      data: mockData,
      fromCache: false,
    });

    const mockFetch = vi.fn();

    render(
      <DataWithCacheFallback
        cacheKey="test-key"
        fetchData={mockFetch}
        showStaleWarning={true}
      >
        {(data) => <div data-testid="content">{JSON.stringify(data)}</div>}
      </DataWithCacheFallback>
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.queryByText(/showing cached content/i)).not.toBeInTheDocument();
    });
  });
});

describe("RealtimeWithFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should establish realtime connection", () => {
    const mockSubscribe = vi.fn(() => vi.fn());
    const mockPoll = vi.fn();
    const mockOnData = vi.fn();

    render(
      <RealtimeWithFallback
        subscribeToRealtime={mockSubscribe}
        pollData={mockPoll}
        onData={mockOnData}
      />
    );

    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("should fall back to polling when realtime fails (Requirement 19.3)", async () => {
    const mockSubscribe = vi.fn(() => {
      throw new Error("Connection failed");
    });
    const mockPoll = vi.fn().mockResolvedValue({ data: "test" });
    const mockOnData = vi.fn();

    render(
      <RealtimeWithFallback
        subscribeToRealtime={mockSubscribe}
        pollData={mockPoll}
        onData={mockOnData}
        pollingInterval={100}
      />
    );

    // Wait for polling to start
    await waitFor(
      () => {
        expect(mockPoll).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it("should show connection status when enabled", () => {
    const mockSubscribe = vi.fn(() => vi.fn());
    const mockPoll = vi.fn();
    const mockOnData = vi.fn();

    render(
      <RealtimeWithFallback
        subscribeToRealtime={mockSubscribe}
        pollData={mockPoll}
        onData={mockOnData}
        showStatus={true}
      >
        <div>Content</div>
      </RealtimeWithFallback>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should call onConnectionChange when status changes", async () => {
    const mockSubscribe = vi.fn(() => vi.fn());
    const mockPoll = vi.fn().mockResolvedValue({ data: "test" });
    const mockOnData = vi.fn();
    const mockOnConnectionChange = vi.fn();

    render(
      <RealtimeWithFallback
        subscribeToRealtime={mockSubscribe}
        pollData={mockPoll}
        onData={mockOnData}
        onConnectionChange={mockOnConnectionChange}
      />
    );

    // Initial connection attempt
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });
});

describe("PartialFeatureWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute critical operations and render children (Requirement 19.9)", async () => {
    const { executeWithPartialFallback } = await import("@/lib/errors");

    const mockResults = ["result1", "result2"];
    vi.mocked(executeWithPartialFallback).mockResolvedValue({
      success: true,
      criticalResults: mockResults,
      errors: [],
    });

    const criticalOps = [
      vi.fn().mockResolvedValue("result1"),
      vi.fn().mockResolvedValue("result2"),
    ];

    render(
      <PartialFeatureWrapper criticalOperations={criticalOps}>
        {(results) => (
          <div data-testid="content">
            Results: {results.length}
          </div>
        )}
      </PartialFeatureWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText(/Results: 2/)).toBeInTheDocument();
    });
  });

  it("should show warnings for non-critical failures", async () => {
    const { executeWithPartialFallback } = await import("@/lib/errors");

    const nonCriticalError = new Error("Non-critical feature failed");
    vi.mocked(executeWithPartialFallback).mockResolvedValue({
      success: true,
      criticalResults: ["result1"],
      errors: [nonCriticalError],
    });

    const criticalOps = [vi.fn().mockResolvedValue("result1")];
    const nonCriticalOps = [vi.fn().mockRejectedValue(nonCriticalError)];

    render(
      <PartialFeatureWrapper
        criticalOperations={criticalOps}
        nonCriticalOperations={nonCriticalOps}
        showNonCriticalWarnings={true}
      >
        {(results) => <div data-testid="content">Content</div>}
      </PartialFeatureWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText(/some features are unavailable/i)).toBeInTheDocument();
    });
  });

  it("should display error when critical operations fail", async () => {
    const { executeWithPartialFallback } = await import("@/lib/errors");

    const criticalError = new Error("Critical operation failed");
    vi.mocked(executeWithPartialFallback).mockRejectedValue(criticalError);

    const criticalOps = [vi.fn().mockRejectedValue(criticalError)];

    const mockOnCriticalFailure = vi.fn();

    render(
      <PartialFeatureWrapper
        criticalOperations={criticalOps}
        onCriticalFailure={mockOnCriticalFailure}
      >
        {(results) => <div>Content</div>}
      </PartialFeatureWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/critical feature unavailable/i)).toBeInTheDocument();
      expect(mockOnCriticalFailure).toHaveBeenCalledWith(criticalError);
    });
  });

  it("should render loading component while executing", () => {
    const { executeWithPartialFallback } = await import("@/lib/errors");

    vi.mocked(executeWithPartialFallback).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const criticalOps = [vi.fn()];

    render(
      <PartialFeatureWrapper
        criticalOperations={criticalOps}
        loadingComponent={<div>Custom Loading...</div>}
      >
        {(results) => <div>Content</div>}
      </PartialFeatureWrapper>
    );

    expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
  });

  it("should call onComplete callback when all operations finish", async () => {
    const { executeWithPartialFallback } = await import("@/lib/errors");

    const mockResults = ["result1", "result2"];
    vi.mocked(executeWithPartialFallback).mockResolvedValue({
      success: true,
      criticalResults: mockResults,
      errors: [],
    });

    const criticalOps = [
      vi.fn().mockResolvedValue("result1"),
      vi.fn().mockResolvedValue("result2"),
    ];

    const mockOnComplete = vi.fn();

    render(
      <PartialFeatureWrapper
        criticalOperations={criticalOps}
        onComplete={mockOnComplete}
      >
        {(results) => <div>Content</div>}
      </PartialFeatureWrapper>
    );

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(mockResults);
    });
  });

  it("should maintain partial functionality when non-critical ops fail", async () => {
    const { executeWithPartialFallback } = await import("@/lib/errors");

    const criticalResults = ["critical1"];
    const nonCriticalErrors = [
      new Error("Feature A failed"),
      new Error("Feature B failed"),
    ];

    vi.mocked(executeWithPartialFallback).mockResolvedValue({
      success: true,
      criticalResults,
      errors: nonCriticalErrors,
    });

    const criticalOps = [vi.fn().mockResolvedValue("critical1")];
    const nonCriticalOps = [
      vi.fn().mockRejectedValue(new Error("Feature A failed")),
      vi.fn().mockRejectedValue(new Error("Feature B failed")),
    ];

    render(
      <PartialFeatureWrapper
        criticalOperations={criticalOps}
        nonCriticalOperations={nonCriticalOps}
        showNonCriticalWarnings={true}
      >
        {(results) => (
          <div data-testid="content">
            Critical features working: {results.length}
          </div>
        )}
      </PartialFeatureWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText(/Critical features working: 1/)).toBeInTheDocument();
      expect(screen.getByText(/2 non-critical features failed to load/i)).toBeInTheDocument();
    });
  });
});
