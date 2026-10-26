import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactionBar } from "../reaction-bar";

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("ReactionBar", () => {
  it("renders like, save, and share buttons", () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ReactionBar
          listingId="test-id"
          initialLikes={10}
          initialSaves={5}
          isLiked={false}
          isSaved={false}
        />
      </QueryClientProvider>,
    );

    // Check that buttons are rendered
    expect(screen.getByLabelText(/like listing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/save listing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share listing/i)).toBeInTheDocument();

    // Check that counts are displayed
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays liked state correctly", () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ReactionBar
          listingId="test-id"
          initialLikes={10}
          initialSaves={5}
          isLiked={true}
          isSaved={false}
        />
      </QueryClientProvider>,
    );

    const likeButton = screen.getByLabelText(/unlike listing/i);
    expect(likeButton).toBeInTheDocument();
    expect(likeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("displays saved state correctly", () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ReactionBar
          listingId="test-id"
          initialLikes={10}
          initialSaves={5}
          isLiked={false}
          isSaved={true}
        />
      </QueryClientProvider>,
    );

    const saveButton = screen.getByLabelText(/unsave listing/i);
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute("aria-pressed", "true");
  });
});
