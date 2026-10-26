/**
 * Unit Tests for VendorDirectory Component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VendorDirectory } from "../vendor-directory";
import type { Vendor } from "../types";

// Mock Framer Motion
vi.mock("framer-motion", () => {
  const React = require("react");
  
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(
      ({ children, initial, animate, variants, whileHover, whileTap, transition, style, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) => {
        return React.createElement(tag, { ...props, ref, style }, children);
      }
    );
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  return {
    motion: {
      div: createMotionComponent("div"),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren<object>) => 
      React.createElement(React.Fragment, null, children),
  };
});

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

const mockVendors: Vendor[] = [
  {
    id: "vendor-1",
    name: "Tech Store Nigeria",
    avatar: "/avatars/vendor1.jpg",
    rating: 4.8,
    reviewCount: 150,
    listingCount: 45,
    specialties: ["Electronics", "Gadgets", "Accessories"],
    verification: {
      phone: true,
      nin: true,
      video: true,
    },
    responseTime: 2,
  },
  {
    id: "vendor-2",
    name: "Fashion Hub",
    avatar: "/avatars/vendor2.jpg",
    rating: 4.5,
    reviewCount: 89,
    listingCount: 120,
    specialties: ["Clothing", "Shoes", "Bags"],
    verification: {
      phone: true,
      nin: false,
      video: true,
    },
    responseTime: 4,
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("VendorDirectory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Requirements 4.1, 4.2", () => {
    it("should display vendors in a responsive grid", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      expect(screen.getByText("Verified Vendors")).toBeInTheDocument();
      expect(screen.getByText("Tech Store Nigeria")).toBeInTheDocument();
      expect(screen.getByText("Fashion Hub")).toBeInTheDocument();
    });

    it("should display vendor profile information", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      // Check that vendor names are displayed
      expect(screen.getByText("Tech Store Nigeria")).toBeInTheDocument();
      
      // Check that ratings are displayed
      expect(screen.getByText("4.8")).toBeInTheDocument();
      expect(screen.getByText("(150 reviews)")).toBeInTheDocument();
    });
  });

  describe("Verification Badges - Requirements 4.3, 4.9", () => {
    it("should display verification badges for verified vendors", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      // Check for verification badges
      const phoneVerified = screen.getAllByRole("status", { name: /phone verified/i });
      expect(phoneVerified.length).toBeGreaterThan(0);
    });

    it("should display fully verified badge for vendors with all verifications", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      // First vendor has all verifications
      const fullyVerified = screen.getByRole("status", { name: /fully verified/i });
      expect(fullyVerified).toBeInTheDocument();
    });
  });

  describe("Ratings - Requirement 4.4", () => {
    it("should display vendor ratings with star icons", () => {
      const { container } = renderWithQueryClient(
        <VendorDirectory initialVendors={mockVendors} />
      );
      
      // Check for star icons (SVG elements)
      const stars = container.querySelectorAll("svg");
      expect(stars.length).toBeGreaterThan(0);
      
      // Check rating values
      expect(screen.getByText("4.8")).toBeInTheDocument();
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("should display review counts", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      expect(screen.getByText("(150 reviews)")).toBeInTheDocument();
      expect(screen.getByText("(89 reviews)")).toBeInTheDocument();
    });
  });

  describe("Vendor Specialties - Requirement 4.7", () => {
    it("should display vendor specialties", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Gadgets")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
    });

    it("should limit displayed specialties to 3 and show count for more", () => {
      const vendorWithManySpecialties: Vendor = {
        ...mockVendors[0],
        specialties: ["A", "B", "C", "D", "E"],
      };

      renderWithQueryClient(
        <VendorDirectory initialVendors={[vendorWithManySpecialties]} />
      );
      
      // Should show first 3 specialties
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
      
      // Should show "+2 more" indicator
      expect(screen.getByText("+2 more")).toBeInTheDocument();
    });
  });

  describe("Navigation - Requirement 4.6", () => {
    it("should link to vendor storefront on click", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      const vendorLinks = screen.getAllByRole("link");
      const vendorLink = vendorLinks.find(link => 
        link.getAttribute("href")?.includes("/store/vendor-1")
      );
      
      expect(vendorLink).toBeInTheDocument();
      expect(vendorLink).toHaveAttribute("href", "/store/vendor-1");
    });
  });

  describe("Pagination - Requirement 4.8", () => {
    it("should display 'View All Vendors' link when vendors are present", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      const viewAllLink = screen.getByRole("link", { name: /view all vendors/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute("href", "/vendors");
    });
  });

  describe("Loading State", () => {
    it("should display skeleton loading states while fetching", () => {
      const { container } = renderWithQueryClient(<VendorDirectory />);
      
      // Check for skeleton elements (animate-pulse class)
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no vendors are available", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={[]} />);
      
      expect(screen.getByText(/no verified vendors available/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /browse all listings/i })).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message with retry button on fetch failure", async () => {
      // Mock fetch to fail
      global.fetch = vi.fn(() =>
        Promise.reject(new Error("Failed to fetch"))
      );

      renderWithQueryClient(<VendorDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load vendors/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for vendor cards", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      const vendorLink = screen.getByRole("link", { 
        name: /view tech store nigeria's storefront/i 
      });
      expect(vendorLink).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      renderWithQueryClient(<VendorDirectory initialVendors={mockVendors} />);
      
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
      
      // Links should be focusable
      links[0].focus();
      expect(links[0]).toHaveFocus();
    });
  });

  describe("Responsive Design", () => {
    it("should apply responsive grid classes", () => {
      const { container } = renderWithQueryClient(
        <VendorDirectory initialVendors={mockVendors} />
      );
      
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("sm:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
      expect(grid).toHaveClass("xl:grid-cols-4");
    });
  });
});
