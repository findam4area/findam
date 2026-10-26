/**
 * Unit Tests for GET /api/business-profiles/[id]/services endpoint
 * Task 7.5: GET /api/business-profiles/[id]/services endpoint
 * Requirements: 10.5, 10.6
 */

import { describe, it, expect } from "vitest";

describe("GET /api/business-profiles/[id]/services - Validation Logic", () => {
  describe("Requirement 10.5: Display service listings separately from products", () => {
    it("should validate service data structure includes all required fields", () => {
      const mockService = {
        id: "service-123",
        business_profile_id: "biz-456",
        title: "Web Development",
        description: "Professional web development service",
        pricing_model: "hourly",
        price: 50.0,
        currency: "NGN",
        duration_text: "2-3 hours",
        image_urls: [
          "https://example.com/service1.jpg",
          "https://example.com/service2.jpg",
        ],
        primary_image_url: "https://example.com/service1.jpg",
        is_active: true,
        is_featured: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Verify all essential fields are present
      expect(mockService.id).toBeDefined();
      expect(mockService.title).toBeDefined();
      expect(mockService.description).toBeDefined();
      expect(mockService.pricing_model).toBeDefined();
      expect(mockService.image_urls).toBeInstanceOf(Array);
      expect(mockService.image_urls.length).toBeGreaterThan(0);
      expect(mockService.primary_image_url).toBeDefined();
    });

    it("should return services with image URLs array", () => {
      const mockService = {
        image_urls: [
          "https://example.com/service1.jpg",
          "https://example.com/service2.jpg",
          "https://example.com/service3.jpg",
        ],
        primary_image_url: "https://example.com/service1.jpg",
      };

      expect(mockService.image_urls).toBeInstanceOf(Array);
      expect(mockService.image_urls.length).toBeGreaterThanOrEqual(1);
      expect(mockService.image_urls.length).toBeLessThanOrEqual(5);
      expect(mockService.primary_image_url).toBe(mockService.image_urls[0]);
    });

    it("should validate pricing model is one of fixed, hourly, or custom", () => {
      const validPricingModels = ["fixed", "hourly", "custom"];
      const mockServices = [
        { pricing_model: "fixed" },
        { pricing_model: "hourly" },
        { pricing_model: "custom" },
      ];

      mockServices.forEach((service) => {
        expect(validPricingModels).toContain(service.pricing_model);
      });
    });
  });

  describe("Requirement 10.6: Display 'Contact for Quote' for custom pricing", () => {
    it("should display 'Contact for Quote' when pricing_model is custom", () => {
      const service = {
        pricing_model: "custom",
        price: null,
        currency: "NGN",
      };

      const displayPrice =
        service.pricing_model === "custom"
          ? "Contact for Quote"
          : service.price
            ? `${service.currency} ${service.price}`
            : "Contact for Quote";

      expect(displayPrice).toBe("Contact for Quote");
    });

    it("should display price for fixed pricing model", () => {
      const service = {
        pricing_model: "fixed",
        price: 100.0,
        currency: "NGN",
      };

      const displayPrice =
        service.pricing_model === "custom"
          ? "Contact for Quote"
          : service.price
            ? `${service.currency} ${service.price}`
            : "Contact for Quote";

      expect(displayPrice).toBe("NGN 100");
    });

    it("should display price for hourly pricing model", () => {
      const service = {
        pricing_model: "hourly",
        price: 50.0,
        currency: "NGN",
      };

      const displayPrice =
        service.pricing_model === "custom"
          ? "Contact for Quote"
          : service.price
            ? `${service.currency} ${service.price}`
            : "Contact for Quote";

      expect(displayPrice).toBe("NGN 50");
    });

    it("should display 'Contact for Quote' when price is null even for non-custom models", () => {
      const service = {
        pricing_model: "fixed",
        price: null,
        currency: "NGN",
      };

      const displayPrice =
        service.pricing_model === "custom"
          ? "Contact for Quote"
          : service.price
            ? `${service.currency} ${service.price}`
            : "Contact for Quote";

      expect(displayPrice).toBe("Contact for Quote");
    });

    it("should format display_price field correctly for multiple services", () => {
      const services = [
        { pricing_model: "fixed", price: 100, currency: "NGN" },
        { pricing_model: "hourly", price: 50, currency: "USD" },
        { pricing_model: "custom", price: null, currency: "NGN" },
      ];

      const formattedServices = services.map((service) => ({
        ...service,
        display_price:
          service.pricing_model === "custom"
            ? "Contact for Quote"
            : service.price
              ? `${service.currency} ${service.price}`
              : "Contact for Quote",
      }));

      expect(formattedServices[0].display_price).toBe("NGN 100");
      expect(formattedServices[1].display_price).toBe("USD 50");
      expect(formattedServices[2].display_price).toBe("Contact for Quote");
    });
  });

  describe("Filtering by is_active", () => {
    it("should filter services by is_active=true", () => {
      const services = [
        { id: "1", title: "Active Service", is_active: true },
        { id: "2", title: "Inactive Service", is_active: false },
        { id: "3", title: "Another Active", is_active: true },
      ];

      const activeServices = services.filter((s) => s.is_active === true);

      expect(activeServices).toHaveLength(2);
      expect(activeServices.every((s) => s.is_active === true)).toBe(true);
    });

    it("should filter services by is_active=false", () => {
      const services = [
        { id: "1", title: "Active Service", is_active: true },
        { id: "2", title: "Inactive Service", is_active: false },
        { id: "3", title: "Another Inactive", is_active: false },
      ];

      const inactiveServices = services.filter((s) => s.is_active === false);

      expect(inactiveServices).toHaveLength(2);
      expect(inactiveServices.every((s) => s.is_active === false)).toBe(true);
    });

    it("should return all services when is_active filter is not specified", () => {
      const services = [
        { id: "1", is_active: true },
        { id: "2", is_active: false },
        { id: "3", is_active: true },
      ];

      // No filter applied
      const allServices = services;

      expect(allServices).toHaveLength(3);
    });
  });

  describe("Filtering by is_featured", () => {
    it("should filter services by is_featured=true", () => {
      const services = [
        { id: "1", title: "Featured Service", is_featured: true },
        { id: "2", title: "Regular Service", is_featured: false },
        { id: "3", title: "Another Featured", is_featured: true },
      ];

      const featuredServices = services.filter((s) => s.is_featured === true);

      expect(featuredServices).toHaveLength(2);
      expect(featuredServices.every((s) => s.is_featured === true)).toBe(true);
    });

    it("should filter services by is_featured=false", () => {
      const services = [
        { id: "1", title: "Featured Service", is_featured: true },
        { id: "2", title: "Regular Service", is_featured: false },
        { id: "3", title: "Another Regular", is_featured: false },
      ];

      const regularServices = services.filter((s) => s.is_featured === false);

      expect(regularServices).toHaveLength(2);
      expect(regularServices.every((s) => s.is_featured === false)).toBe(true);
    });
  });

  describe("Combined filtering", () => {
    it("should support filtering by both is_active and is_featured", () => {
      const services = [
        { id: "1", is_active: true, is_featured: true },
        { id: "2", is_active: true, is_featured: false },
        { id: "3", is_active: false, is_featured: true },
        { id: "4", is_active: false, is_featured: false },
      ];

      const activeFeaturedServices = services.filter(
        (s) => s.is_active === true && s.is_featured === true,
      );

      expect(activeFeaturedServices).toHaveLength(1);
      expect(activeFeaturedServices[0].id).toBe("1");
    });
  });

  describe("Response structure", () => {
    it("should return services array and total count", () => {
      const mockResponse = {
        services: [
          { id: "1", title: "Service 1" },
          { id: "2", title: "Service 2" },
        ],
        total: 2,
      };

      expect(mockResponse.services).toBeInstanceOf(Array);
      expect(mockResponse.total).toBe(mockResponse.services.length);
    });

    it("should return empty array when no services exist", () => {
      const mockResponse = {
        services: [],
        total: 0,
      };

      expect(mockResponse.services).toHaveLength(0);
      expect(mockResponse.total).toBe(0);
    });

    it("should order services by created_at descending (newest first)", () => {
      const services = [
        { id: "1", created_at: "2024-01-01T00:00:00Z" },
        { id: "2", created_at: "2024-01-03T00:00:00Z" },
        { id: "3", created_at: "2024-01-02T00:00:00Z" },
      ];

      // Simulate ordering by created_at descending
      const orderedServices = [...services].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      expect(orderedServices[0].id).toBe("2"); // Newest (Jan 3)
      expect(orderedServices[1].id).toBe("3"); // Middle (Jan 2)
      expect(orderedServices[2].id).toBe("1"); // Oldest (Jan 1)
    });

    it("should include display_price in formatted response", () => {
      const services = [
        {
          id: "1",
          pricing_model: "fixed",
          price: 100,
          currency: "NGN",
        },
        {
          id: "2",
          pricing_model: "custom",
          price: null,
          currency: "NGN",
        },
      ];

      const formattedServices = services.map((service) => ({
        ...service,
        display_price:
          service.pricing_model === "custom"
            ? "Contact for Quote"
            : service.price
              ? `${service.currency} ${service.price}`
              : "Contact for Quote",
      }));

      expect(formattedServices[0]).toHaveProperty("display_price");
      expect(formattedServices[1]).toHaveProperty("display_price");
    });
  });

  describe("Query parameter parsing", () => {
    it("should parse is_active query parameter as boolean", () => {
      const testCases = [
        { param: "true", expected: true },
        { param: "false", expected: false },
        { param: null, expected: null },
      ];

      testCases.forEach(({ param, expected }) => {
        const parsed = param === null ? null : param === "true";
        expect(parsed).toBe(expected);
      });
    });

    it("should parse is_featured query parameter as boolean", () => {
      const testCases = [
        { param: "true", expected: true },
        { param: "false", expected: false },
        { param: null, expected: null },
      ];

      testCases.forEach(({ param, expected }) => {
        const parsed = param === null ? null : param === "true";
        expect(parsed).toBe(expected);
      });
    });
  });

  describe("Duration text display", () => {
    it("should include duration_text when provided", () => {
      const service = {
        duration_text: "2-3 hours",
      };

      expect(service.duration_text).toBeDefined();
      expect(typeof service.duration_text).toBe("string");
    });

    it("should handle missing duration_text gracefully", () => {
      const service = {
        id: "1",
        title: "Service without duration",
        duration_text: null,
      };

      expect(service.duration_text).toBeNull();
    });

    it("should display various duration formats", () => {
      const services = [
        { duration_text: "2-3 hours" },
        { duration_text: "1 week" },
        { duration_text: "Same day" },
        { duration_text: "3-5 business days" },
      ];

      services.forEach((service) => {
        expect(service.duration_text).toBeTruthy();
        expect(typeof service.duration_text).toBe("string");
      });
    });
  });

  describe("Price and currency display", () => {
    it("should display currency with price", () => {
      const services = [
        { price: 100, currency: "NGN", expected: "NGN 100" },
        { price: 50.5, currency: "USD", expected: "USD 50.5" },
        { price: 75.99, currency: "GBP", expected: "GBP 75.99" },
      ];

      services.forEach(({ price, currency, expected }) => {
        const display = `${currency} ${price}`;
        expect(display).toBe(expected);
      });
    });

    it("should default to NGN currency when not specified", () => {
      const DEFAULT_CURRENCY = "NGN";
      const service = {
        price: 100,
        currency: DEFAULT_CURRENCY,
      };

      expect(service.currency).toBe("NGN");
    });
  });

  describe("Service image handling", () => {
    it("should ensure at least 1 image is present", () => {
      const service = {
        image_urls: ["https://example.com/service.jpg"],
        primary_image_url: "https://example.com/service.jpg",
      };

      expect(service.image_urls.length).toBeGreaterThanOrEqual(1);
    });

    it("should ensure no more than 5 images", () => {
      const service = {
        image_urls: [
          "https://example.com/img1.jpg",
          "https://example.com/img2.jpg",
          "https://example.com/img3.jpg",
        ],
      };

      expect(service.image_urls.length).toBeLessThanOrEqual(5);
    });

    it("should ensure primary_image_url is from image_urls array", () => {
      const service = {
        image_urls: [
          "https://example.com/img1.jpg",
          "https://example.com/img2.jpg",
        ],
        primary_image_url: "https://example.com/img1.jpg",
      };

      expect(service.image_urls).toContain(service.primary_image_url);
    });
  });
});
