/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { StaleContentWarning } from "@/components/stale-content-warning";

// Mock the useOffline hook with proper state management
const mockUseOffline = vi.fn(() => ({
  isOnline: true,
  queuedActions: [],
  queueAction: vi.fn(),
  syncOfflineQueue: vi.fn(),
  clearQueue: vi.fn(),
}));

vi.mock("@/lib/hooks/useOffline", () => ({
  useOffline: () => mockUseOffline(),
}));

describe("Offline Functionality - Task 18.2", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("Requirement 17.3: Display offline indicator when network unavailable", () => {
    it("should display offline indicator when offline", () => {
      // Mock offline state
      mockUseOffline.mockReturnValue({
        isOnline: false,
        queuedActions: [],
        queueAction: vi.fn(),
        syncOfflineQueue: vi.fn(),
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      const indicator = screen.getByText(/you're offline/i);
      expect(indicator).toBeInTheDocument();
    });

    it("should not display offline indicator when online", () => {
      mockUseOffline.mockReturnValue({
        isOnline: true,
        queuedActions: [],
        queueAction: vi.fn(),
        syncOfflineQueue: vi.fn(),
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      const indicator = screen.queryByText(/you're offline/i);
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe("Requirement 17.4: Queue user actions when offline", () => {
    it("should display queued actions count when offline", () => {
      const queuedActions = [
        {
          id: 1,
          url: "/api/listings/123/like",
          method: "POST",
          headers: {},
          body: "{}",
          timestamp: Date.now(),
        },
        {
          id: 2,
          url: "/api/listings/456/save",
          method: "POST",
          headers: {},
          body: "{}",
          timestamp: Date.now(),
        },
      ];

      mockUseOffline.mockReturnValue({
        isOnline: false,
        queuedActions,
        queueAction: vi.fn(),
        syncOfflineQueue: vi.fn(),
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      expect(screen.getByText(/2 actions queued/i)).toBeInTheDocument();
    });

    it("should show singular form for single queued action", () => {
      const queuedActions = [
        {
          id: 1,
          url: "/api/listings/123/like",
          method: "POST",
          headers: {},
          body: "{}",
          timestamp: Date.now(),
        },
      ];

      mockUseOffline.mockReturnValue({
        isOnline: false,
        queuedActions,
        queueAction: vi.fn(),
        syncOfflineQueue: vi.fn(),
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      expect(screen.getByText(/1 action queued/i)).toBeInTheDocument();
    });
  });

  describe("Requirement 17.9: Sync queued actions when connection restored", () => {
    it("should display sync button when back online with queued actions", () => {
      const queuedActions = [
        {
          id: 1,
          url: "/api/listings/123/like",
          method: "POST",
          headers: {},
          body: "{}",
          timestamp: Date.now(),
        },
      ];

      mockUseOffline.mockReturnValue({
        isOnline: true,
        queuedActions,
        queueAction: vi.fn(),
        syncOfflineQueue: vi.fn(),
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      const syncButton = screen.getByRole("button", {
        name: /sync queued actions now/i,
      });
      expect(syncButton).toBeInTheDocument();
    });

    it("should call syncOfflineQueue when sync button is clicked", async () => {
      const user = userEvent.setup();
      const mockSync = vi.fn();
      const queuedActions = [
        {
          id: 1,
          url: "/api/listings/123/like",
          method: "POST",
          headers: {},
          body: "{}",
          timestamp: Date.now(),
        },
      ];

      mockUseOffline.mockReturnValue({
        isOnline: true,
        queuedActions,
        queueAction: vi.fn(),
        syncOfflineQueue: mockSync,
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      const syncButton = screen.getByRole("button", {
        name: /sync queued actions now/i,
      });

      await user.click(syncButton);

      expect(mockSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("Requirement 17.8: Display stale content warnings for data older than 24 hours", () => {
    it("should display stale content warning when data is older than 24 hours", () => {
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      const mockRefresh = vi.fn();

      render(
        <StaleContentWarning
          lastUpdated={twentyFiveHoursAgo}
          onRefresh={mockRefresh}
        />
      );

      expect(
        screen.getByText(/this content may be outdated/i)
      ).toBeInTheDocument();
    });

    it("should not display warning when data is less than 24 hours old", () => {
      const twentyHoursAgo = Date.now() - 20 * 60 * 60 * 1000;
      const mockRefresh = vi.fn();

      render(
        <StaleContentWarning
          lastUpdated={twentyHoursAgo}
          onRefresh={mockRefresh}
        />
      );

      const warning = screen.queryByText(/this content may be outdated/i);
      expect(warning).not.toBeInTheDocument();
    });

    it("should display refresh button when content is stale", () => {
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      const mockRefresh = vi.fn();

      render(
        <StaleContentWarning
          lastUpdated={twentyFiveHoursAgo}
          onRefresh={mockRefresh}
        />
      );

      const refreshButton = screen.getByRole("button", {
        name: /refresh content/i,
      });
      expect(refreshButton).toBeInTheDocument();
    });

    it("should call onRefresh when refresh button is clicked", async () => {
      const user = userEvent.setup();
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      const mockRefresh = vi.fn();

      render(
        <StaleContentWarning
          lastUpdated={twentyFiveHoursAgo}
          onRefresh={mockRefresh}
        />
      );

      const refreshButton = screen.getByRole("button", {
        name: /refresh content/i,
      });

      await user.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("should display age text correctly", () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const mockRefresh = vi.fn();

      render(
        <StaleContentWarning lastUpdated={twoDaysAgo} onRefresh={mockRefresh} />
      );

      expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility - Offline Indicator", () => {
    it("should have proper ARIA attributes when offline", () => {
      mockUseOffline.mockReturnValue({
        isOnline: false,
        queuedActions: [],
        queueAction: vi.fn(),
        syncOfflineQueue: vi.fn(),
        clearQueue: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
        </QueryClientProvider>
      );

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-live", "polite");
      expect(indicator).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("Accessibility - Stale Content Warning", () => {
    it("should have proper ARIA attributes", () => {
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      const mockRefresh = vi.fn();

      render(
        <StaleContentWarning
          lastUpdated={twentyFiveHoursAgo}
          onRefresh={mockRefresh}
        />
      );

      const warning = screen.getByRole("alert");
      expect(warning).toHaveAttribute("aria-live", "polite");
    });
  });
});
