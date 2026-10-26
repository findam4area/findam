import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BusinessSearchBar } from "./BusinessSearchBar";
import * as searchHistory from "@/lib/utils/search-history";
import { useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock search history utilities
vi.mock("@/lib/utils/search-history", () => ({
  getRecentSearches: vi.fn(),
  removeSearchFromHistory: vi.fn(),
  addSearchToHistory: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe("BusinessSearchBar", () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (searchHistory.getRecentSearches as any).mockReturnValue([]);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input with placeholder", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByPlaceholderText(
      /search businesses, categories, or locations/i
    );
    expect(input).toBeDefined();
  });

  it("should render with custom placeholder", () => {
    const customPlaceholder = "Find your business";
    render(<BusinessSearchBar placeholder={customPlaceholder} />);
    
    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeDefined();
  });

  it("should display default value when provided", () => {
    const defaultValue = "test query";
    render(<BusinessSearchBar defaultValue={defaultValue} />);
    
    const input = screen.getByDisplayValue(defaultValue);
    expect(input).toBeDefined();
  });

  it("should update input value when user types", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "restaurant" } });
    
    expect((input as HTMLInputElement).value).toBe("restaurant");
  });

  it("should show clear button when input has value", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeDefined();
  });

  it("should clear input when clear button is clicked", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });
    
    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);
    
    expect(input.value).toBe("");
  });

  it("should fetch autocomplete suggestions when typing 2+ characters", async () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "re" } });
    
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/search/autocomplete?q=re")
        );
      },
      { timeout: 500 }
    );
  });

  it("should not fetch suggestions for single character", async () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "r" } });
    
    // Wait a bit to ensure fetch is not called
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should display autocomplete suggestions", async () => {
    const mockSuggestions = [
      {
        type: "business",
        id: "1",
        text: "Restaurant ABC",
        location: "Lagos, Nigeria",
        rating: 4.5,
      },
      {
        type: "category",
        id: "2",
        text: "Food & Beverage",
      },
      {
        type: "location",
        id: null,
        text: "Lagos, Nigeria",
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "rest" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("Restaurant ABC")).toBeDefined();
      expect(screen.getByText("Food & Beverage")).toBeDefined();
      // "Lagos, Nigeria" appears multiple times (in location and in business suggestion)
      const lagosElements = screen.getAllByText("Lagos, Nigeria");
      expect(lagosElements.length).toBeGreaterThan(0);
    });
  });

  it("should navigate to search results on Enter key", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test query" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/search?q=test+query")
    );
  });

  it("should add search to history when submitting", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test query" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
    expect(searchHistory.addSearchToHistory).toHaveBeenCalledWith("test query");
  });

  it("should call onSearch callback when provided", () => {
    const mockOnSearch = vi.fn();
    render(<BusinessSearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });

  it("should display recent searches when input is focused with empty query", () => {
    const recentSearches = [
      { query: "recent 1", timestamp: Date.now() },
      { query: "recent 2", timestamp: Date.now() - 1000 },
    ];
    
    (searchHistory.getRecentSearches as any).mockReturnValue(recentSearches);
    
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    
    expect(screen.getByText("Recent Searches")).toBeDefined();
    expect(screen.getByText("recent 1")).toBeDefined();
    expect(screen.getByText("recent 2")).toBeDefined();
  });

  it("should close suggestions on Escape key", async () => {
    const mockSuggestions = [
      { type: "business", id: "1", text: "Test Business" },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeDefined();
    });

    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
    
    // Suggestions should be hidden (listbox removed)
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  it("should handle suggestion click and navigate", async () => {
    const mockSuggestions = [
      {
        type: "business",
        id: "1",
        text: "Test Business",
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeDefined();
    });

    const suggestion = screen.getByText("Test Business");
    fireEvent.click(suggestion);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/search?q=Test+Business&type=business")
    );
  });

  it("should display suggestion with rating for business type", async () => {
    const mockSuggestions = [
      {
        type: "business",
        id: "1",
        text: "Restaurant",
        rating: 4.5,
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "rest" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("★ 4.5")).toBeDefined();
    });
  });

  it("should not submit empty search", () => {
    render(<BusinessSearchBar />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
    expect(mockPush).not.toHaveBeenCalled();
  });
});
