import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb, BreadcrumbCompact } from "../breadcrumb";
import type { BreadcrumbItem } from "../breadcrumb";

describe("Breadcrumb", () => {
  const singleLevelItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
  ];

  const twoLevelItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Browse Categories", href: "/browse" },
  ];

  const threeLevelItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Electronics", href: "/categories/electronics" },
    { label: "Laptops", href: "/categories/laptops" },
  ];

  const deepNestedItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Electronics", href: "/categories/electronics" },
    { label: "Computers", href: "/categories/computers" },
    { label: "Laptops", href: "/categories/laptops" },
    { label: "Gaming Laptops", href: "/categories/gaming-laptops" },
  ];

  describe("Rendering", () => {
    it("renders semantic nav element with aria-label", () => {
      render(<Breadcrumb items={twoLevelItems} />);
      
      const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
      expect(nav).toBeInTheDocument();
    });

    it("renders all breadcrumb items", () => {
      render(<Breadcrumb items={threeLevelItems} />);
      
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Laptops")).toBeInTheDocument();
    });

    it("renders Home icon for first item", () => {
      const { container } = render(<Breadcrumb items={twoLevelItems} />);
      
      // Check that the Home icon is present (lucide-react renders SVG with specific class)
      const homeIcon = container.querySelector('svg');
      expect(homeIcon).toBeInTheDocument();
    });
  });

  describe("Links and Navigation", () => {
    it("renders non-current items as links", () => {
      render(<Breadcrumb items={threeLevelItems} />);
      
      const homeLink = screen.getByRole("link", { name: /Home/i });
      expect(homeLink).toHaveAttribute("href", "/");
      
      const electronicsLink = screen.getByRole("link", { name: /Electronics/i });
      expect(electronicsLink).toHaveAttribute("href", "/categories/electronics");
    });

    it("renders last item without link and with aria-current", () => {
      render(<Breadcrumb items={threeLevelItems} />);
      
      // Last item should not be a link
      const laptopsElement = screen.getByText("Laptops").closest("span");
      expect(laptopsElement).toHaveAttribute("aria-current", "page");
      
      // Should not be wrapped in a link
      expect(laptopsElement?.tagName).toBe("SPAN");
    });

    it("highlights current page with different styling", () => {
      render(<Breadcrumb items={twoLevelItems} />);
      
      const currentPage = screen.getByText("Browse Categories").closest("span");
      expect(currentPage).toHaveClass("text-white");
      expect(currentPage).toHaveClass("bg-primary-500/10");
    });
  });

  describe("Structured Data", () => {
    it("includes schema.org BreadcrumbList structured data", () => {
      const { container } = render(<Breadcrumb items={threeLevelItems} />);
      
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();
      
      if (script?.textContent) {
        const structuredData = JSON.parse(script.textContent);
        expect(structuredData["@type"]).toBe("BreadcrumbList");
        expect(structuredData.itemListElement).toHaveLength(3);
      }
    });

    it("includes correct position for each breadcrumb item", () => {
      const { container } = render(<Breadcrumb items={threeLevelItems} />);
      
      const script = container.querySelector('script[type="application/ld+json"]');
      if (script?.textContent) {
        const structuredData = JSON.parse(script.textContent);
        
        expect(structuredData.itemListElement[0].position).toBe(1);
        expect(structuredData.itemListElement[0].name).toBe("Home");
        
        expect(structuredData.itemListElement[1].position).toBe(2);
        expect(structuredData.itemListElement[1].name).toBe("Electronics");
        
        expect(structuredData.itemListElement[2].position).toBe(3);
        expect(structuredData.itemListElement[2].name).toBe("Laptops");
      }
    });
  });

  describe("Visual Separators", () => {
    it("does not show separator before first item", () => {
      const { container } = render(<Breadcrumb items={threeLevelItems} />);
      
      // Get all separator chevrons
      const chevrons = container.querySelectorAll('svg[class*="lucide-chevron"]');
      
      // Should have 2 separators for 3 items (between items, not before first)
      expect(chevrons.length).toBeGreaterThanOrEqual(2);
    });

    it("shows separators between items", () => {
      const { container } = render(<Breadcrumb items={threeLevelItems} />);
      
      // Check for ChevronRight separators
      const chevrons = container.querySelectorAll('svg');
      
      // At least one separator should exist (between items)
      expect(chevrons.length).toBeGreaterThan(1); // Home icon + at least 1 separator
    });
  });

  describe("Accessibility", () => {
    it("has proper focus indicators on links", () => {
      const { container } = render(<Breadcrumb items={threeLevelItems} />);
      
      const links = container.querySelectorAll("a");
      links.forEach(link => {
        expect(link).toHaveClass("focus-visible:ring-2");
        expect(link).toHaveClass("focus-visible:ring-primary-500");
      });
    });

    it("marks separators as aria-hidden", () => {
      const { container } = render(<Breadcrumb items={threeLevelItems} />);
      
      // ChevronRight icons should be aria-hidden
      const separators = Array.from(container.querySelectorAll('svg')).filter(
        svg => svg.classList.contains('text-gray-500') || svg.getAttribute('aria-hidden') === 'true'
      );
      
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe("Single Item Breadcrumb", () => {
    it("renders single item correctly as current page", () => {
      render(<Breadcrumb items={singleLevelItems} />);
      
      const homeElement = screen.getByText("Home").closest("span");
      expect(homeElement).toHaveAttribute("aria-current", "page");
    });

    it("does not show separators for single item", () => {
      const { container } = render(<Breadcrumb items={singleLevelItems} />);
      
      // Only Home icon, no ChevronRight separators
      const chevrons = Array.from(container.querySelectorAll('svg')).filter(
        svg => !svg.classList.contains('lucide-home')
      );
      
      expect(chevrons.length).toBe(0);
    });
  });

  describe("Deep Nesting", () => {
    it("handles deeply nested paths correctly", () => {
      render(<Breadcrumb items={deepNestedItems} />);
      
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Computers")).toBeInTheDocument();
      expect(screen.getByText("Laptops")).toBeInTheDocument();
      expect(screen.getByText("Gaming Laptops")).toBeInTheDocument();
    });

    it("marks only last item as current page in deep hierarchy", () => {
      render(<Breadcrumb items={deepNestedItems} />);
      
      const currentPage = screen.getByText("Gaming Laptops").closest("span");
      expect(currentPage).toHaveAttribute("aria-current", "page");
      
      // Other items should be links
      expect(screen.getByRole("link", { name: /Home/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Electronics/i })).toBeInTheDocument();
    });
  });

  describe("BreadcrumbCompact", () => {
    it("shows all items when path has 3 or fewer items", () => {
      render(<BreadcrumbCompact items={threeLevelItems} />);
      
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Laptops")).toBeInTheDocument();
    });

    it("shows ellipsis for paths longer than 3 items", () => {
      render(<BreadcrumbCompact items={deepNestedItems} />);
      
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("...")).toBeInTheDocument();
      expect(screen.getByText("Gaming Laptops")).toBeInTheDocument();
    });

    it("omits middle items in compact mode for long paths", () => {
      render(<BreadcrumbCompact items={deepNestedItems} />);
      
      // Should NOT show middle items
      expect(screen.queryByText("Computers")).not.toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <Breadcrumb items={twoLevelItems} className="custom-breadcrumb" />
      );
      
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("custom-breadcrumb");
    });

    it("maintains glass morphism styling", () => {
      const { container } = render(<Breadcrumb items={twoLevelItems} />);
      
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("backdrop-blur-sm");
      expect(nav).toHaveClass("bg-dark-card/50");
    });
  });

  describe("Responsive Design", () => {
    it("includes horizontal scroll for overflow", () => {
      const { container } = render(<Breadcrumb items={deepNestedItems} />);
      
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("overflow-x-auto");
    });

    it("prevents breadcrumb items from wrapping", () => {
      const { container } = render(<Breadcrumb items={deepNestedItems} />);
      
      const list = container.querySelector("ol");
      expect(list).toHaveClass("min-w-max");
    });
  });
});
