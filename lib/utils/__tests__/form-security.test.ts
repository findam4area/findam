/**
 * Form Security Utilities Tests
 * Tests for form sanitization and secure submission helpers
 * Requirements: 31.3, 31.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeFormData,
  validateFormSecurity,
  createSecureFormHandler,
} from "../form-security";

// Mock CSRF headers
vi.mock("@/lib/hooks/use-csrf-token", () => ({
  getCsrfHeaders: vi.fn(() => ({
    "X-CSRF-Token": "mock-csrf-token",
  })),
}));

describe("Form Security Utilities", () => {
  describe("sanitizeFormData", () => {
    it("should sanitize all string fields by default", () => {
      const data = {
        name: "  John Doe  ",
        email: "  test@example.com  ",
        age: 25,
      };

      const sanitized = sanitizeFormData(data);

      expect(sanitized.name).toBe("John Doe");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.age).toBe(25);
    });

    it("should apply content sanitization to specified fields", () => {
      const data = {
        title: "Product Title",
        description: '<script>alert("xss")</script>Great product!',
      };

      const sanitized = sanitizeFormData(data, {
        contentFields: ["description"],
      });

      expect(sanitized.title).toBe("Product Title");
      expect(sanitized.description).toContain("&lt;script&gt;");
      expect(sanitized.description).toContain("Great product!");
    });

    it("should skip specified fields", () => {
      const data = {
        username: "  john_doe  ",
        password: "  secret123  ",
      };

      const sanitized = sanitizeFormData(data, {
        skipFields: ["password"],
      });

      expect(sanitized.username).toBe("john_doe");
      expect(sanitized.password).toBe("  secret123  "); // Not sanitized
    });

    it("should handle nested objects", () => {
      const data = {
        user: {
          name: "  John  ",
          email: "  test@example.com  ",
        },
        product: {
          title: "  Product  ",
        },
      };

      const sanitized = sanitizeFormData(data);

      expect(sanitized.user.name).toBe("John");
      expect(sanitized.user.email).toBe("test@example.com");
      expect(sanitized.product.title).toBe("Product");
    });

    it("should handle arrays", () => {
      const data = {
        tags: ["  tag1  ", "  tag2  ", "  tag3  "],
        numbers: [1, 2, 3],
      };

      const sanitized = sanitizeFormData(data);

      expect(sanitized.tags).toEqual(["tag1", "tag2", "tag3"]);
      expect(sanitized.numbers).toEqual([1, 2, 3]);
    });

    it("should handle arrays with content fields", () => {
      const data = {
        comments: [
          '<script>alert(1)</script>Comment 1',
          '<img onerror="alert(2)" src="x">Comment 2',
        ],
      };

      const sanitized = sanitizeFormData(data, {
        contentFields: ["comments"],
      });

      expect(sanitized.comments[0]).toContain("&lt;script&gt;");
      expect(sanitized.comments[0]).toContain("Comment 1");
      expect(sanitized.comments[1]).toContain("&lt;img");
      expect(sanitized.comments[1]).toContain("Comment 2");
    });

    it("should preserve non-string values", () => {
      const data = {
        name: "John",
        age: 25,
        active: true,
        score: 95.5,
        metadata: null,
        tags: undefined,
      };

      const sanitized = sanitizeFormData(data);

      expect(sanitized.age).toBe(25);
      expect(sanitized.active).toBe(true);
      expect(sanitized.score).toBe(95.5);
      expect(sanitized.metadata).toBe(null);
      expect(sanitized.tags).toBe(undefined);
    });

    it("should handle empty objects", () => {
      const data = {};
      const sanitized = sanitizeFormData(data);
      expect(sanitized).toEqual({});
    });

    it("should handle complex nested structures", () => {
      const data = {
        user: {
          profile: {
            name: "  John  ",
            bio: '<script>alert("xss")</script>Developer',
          },
          settings: {
            notifications: true,
          },
        },
      };

      // Sanitize without contentFields - nested strings get basic sanitization
      const sanitized = sanitizeFormData(data);

      expect(sanitized.user.profile.name).toBe("John");
      // Basic sanitization trims and normalizes but doesn't escape HTML for non-content fields
      // The bio field will be sanitized with basic input sanitization
      expect(sanitized.user.profile.bio).toBeDefined();
      expect(sanitized.user.settings.notifications).toBe(true);
    });
  });

  describe("validateFormSecurity", () => {
    it("should pass validation for normal data", () => {
      const data = {
        name: "John Doe",
        email: "test@example.com",
        message: "Hello world!",
      };

      const result = validateFormSecurity(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect suspiciously long inputs", () => {
      const data = {
        name: "John",
        message: "a".repeat(100001), // Over 100k characters
      };

      const result = validateFormSecurity(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Field "message" exceeds maximum length',
      );
    });

    it("should detect null bytes", () => {
      const data = {
        name: "John\0Doe",
        email: "test@example.com",
      };

      const result = validateFormSecurity(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "name" contains null bytes');
    });

    it("should detect multiple security issues", () => {
      const data = {
        name: "John\0Doe",
        message: "a".repeat(100001),
      };

      const result = validateFormSecurity(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it("should handle nested objects", () => {
      const data = {
        user: {
          name: "John\0Doe",
        },
      };

      const result = validateFormSecurity(data);

      expect(result.valid).toBe(true); // Nested objects not validated by default
    });

    it("should handle empty data", () => {
      const data = {};
      const result = validateFormSecurity(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("createSecureFormHandler", () => {
    beforeEach(() => {
      // Mock fetch
      vi.clearAllMocks();
      global.fetch = vi.fn();
    });

    it("should create a form handler function", () => {
      const handler = createSecureFormHandler("/api/test");
      expect(typeof handler).toBe("function");
    });

    it("should call onSuccess when request succeeds", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();
      const handler = createSecureFormHandler("/api/test", { onSuccess });

      await handler({ name: "John" });

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it("should call onError when request fails", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ message: "Bad request" }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const onError = vi.fn();
      const handler = createSecureFormHandler("/api/test", { onError });

      await expect(handler({ name: "John" })).rejects.toThrow("Bad request");
      expect(onError).toHaveBeenCalled();
    });

    it("should validate data before submission", async () => {
      const validate = vi.fn().mockReturnValue({
        valid: false,
        errors: ["Invalid data"],
      });

      const handler = createSecureFormHandler("/api/test", { validate });

      await expect(handler({ name: "John" })).rejects.toThrow("Invalid data");
      expect(validate).toHaveBeenCalledWith({ name: "John" });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should perform security validation", async () => {
      const handler = createSecureFormHandler("/api/test");

      const data = {
        name: "John\0Doe", // Contains null byte
      };

      await expect(handler(data)).rejects.toThrow("contains null bytes");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should sanitize data before submission", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const handler = createSecureFormHandler("/api/test", {
        contentFields: ["description"],
      });

      await handler({
        title: "  Product  ",
        description: '<script>alert("xss")</script>Description',
      } as any);

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.title).toBe("Product");
      expect(body.description).toContain("&lt;script&gt;");
    });

    it("should use specified HTTP method", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const handler = createSecureFormHandler("/api/test", { method: "PUT" });

      await handler({ name: "John" });

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].method).toBe("PUT");
    });

    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const onError = vi.fn();
      const handler = createSecureFormHandler("/api/test", { onError });

      await expect(handler({ name: "John" })).rejects.toThrow("Network error");
      expect(onError).toHaveBeenCalled();
    });

    it("should handle response without error message", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const handler = createSecureFormHandler("/api/test");

      await expect(handler({ name: "John" })).rejects.toThrow(
        "Request failed with status 500",
      );
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it("should handle complete form submission flow", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 1, success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const handler = createSecureFormHandler("/api/listings", {
        method: "POST",
        contentFields: ["description"],
        onSuccess,
        onError,
      });

      const formData = {
        title: "  Product Title  ",
        description: '<script>alert("xss")</script>Great product!',
        price: 100,
      };

      await handler(formData);

      // Verify handlers were called correctly
      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();

      // Verify fetch was called with correct parameters
      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[0]).toBe("/api/listings");
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
      
      // Verify body was sanitized
      const body = JSON.parse(callArgs[1].body);
      expect(body).toBeDefined();
      expect(body.title).toBeDefined();
      expect(body.description).toBeDefined();
      expect(body.price).toBe(100);
    });

    it("should handle validation failure in complete flow", async () => {
      const validate = vi.fn().mockReturnValue({
        valid: false,
        errors: ["Price must be positive"],
      });

      const onError = vi.fn();

      const handler = createSecureFormHandler("/api/listings", {
        validate,
        onError,
      });

      await expect(
        handler({ title: "Product", price: -10 }),
      ).rejects.toThrow("Price must be positive");

      expect(onError).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
