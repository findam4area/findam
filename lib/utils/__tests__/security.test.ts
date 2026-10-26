import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  sanitizeHtml,
  escapeHtml,
  sanitizeUrl,
  sanitizeFilename,
  sanitizePhoneNumber,
  sanitizeEmail,
  containsSqlInjection,
  containsXss,
  sanitizeUserContent,
  sanitizeObject,
} from "../sanitization";

describe("Input Sanitization", () => {
  describe("sanitizeInput", () => {
    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("should remove null bytes", () => {
      expect(sanitizeInput("hello\0world")).toBe("helloworld");
    });

    it("should normalize multiple spaces", () => {
      expect(sanitizeInput("hello    world")).toBe("hello world");
    });

    it("should handle empty strings", () => {
      expect(sanitizeInput("")).toBe("");
    });
  });

  describe("sanitizeHtml", () => {
    it("should remove script tags", () => {
      const input = '<script>alert("xss")</script>Hello';
      expect(sanitizeHtml(input)).not.toContain("<script>");
    });

    it("should remove event handlers", () => {
      const input = '<div onclick="alert()">Hello</div>';
      expect(sanitizeHtml(input)).not.toContain("onclick");
    });

    it("should remove javascript: protocol", () => {
      const input = '<a href="javascript:alert()">Link</a>';
      expect(sanitizeHtml(input)).not.toContain("javascript:");
    });

    it("should remove iframe tags", () => {
      const input = '<iframe src="evil.com"></iframe>';
      expect(sanitizeHtml(input)).not.toContain("<iframe>");
    });
  });

  describe("escapeHtml", () => {
    it("should escape HTML entities", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
      expect(escapeHtml('"test"')).toBe("&quot;test&quot;");
      expect(escapeHtml("'test'")).toBe("&#x27;test&#x27;");
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });
  });

  describe("sanitizeUrl", () => {
    it("should allow https URLs", () => {
      const url = "https://example.com";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should block javascript: protocol", () => {
      expect(sanitizeUrl("javascript:alert()")).toBe("");
    });

    it("should block data: protocol", () => {
      expect(sanitizeUrl("data:text/html,<script>")).toBe("");
    });

    it("should trim whitespace", () => {
      expect(sanitizeUrl("  https://example.com  ")).toBe(
        "https://example.com",
      );
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove path separators", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("etcpasswd");
    });

    it("should remove null bytes", () => {
      expect(sanitizeFilename("file\0.txt")).toBe("file.txt");
    });

    it("should remove leading dots", () => {
      expect(sanitizeFilename("...hidden")).toBe("hidden");
    });

    it("should limit length", () => {
      const longName = "a".repeat(300) + ".txt";
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe("sanitizePhoneNumber", () => {
    it("should format Nigerian phone numbers", () => {
      expect(sanitizePhoneNumber("08012345678")).toBe("+2348012345678");
    });

    it("should preserve +234 prefix", () => {
      expect(sanitizePhoneNumber("+2348012345678")).toBe("+2348012345678");
    });

    it("should remove non-digit characters", () => {
      expect(sanitizePhoneNumber("+234 (801) 234-5678")).toBe("+2348012345678");
    });
  });

  describe("sanitizeEmail", () => {
    it("should convert to lowercase", () => {
      expect(sanitizeEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
    });

    it("should trim whitespace", () => {
      expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
    });

    it("should remove internal whitespace", () => {
      expect(sanitizeEmail("test @example.com")).toBe("test@example.com");
    });
  });

  describe("containsSqlInjection", () => {
    it("should detect SQL keywords", () => {
      expect(containsSqlInjection("SELECT * FROM users")).toBe(true);
      expect(containsSqlInjection("DROP TABLE users")).toBe(true);
      expect(containsSqlInjection("' OR '1'='1")).toBe(true);
    });

    it("should not flag normal text", () => {
      expect(containsSqlInjection("Hello world")).toBe(false);
      expect(containsSqlInjection("I want to select a product")).toBe(false);
    });
  });

  describe("containsXss", () => {
    it("should detect XSS patterns", () => {
      expect(containsXss("<script>alert()</script>")).toBe(true);
      expect(containsXss("javascript:alert()")).toBe(true);
      expect(containsXss('<img onerror="alert()">')).toBe(true);
    });

    it("should not flag normal HTML", () => {
      expect(containsXss("Hello <b>world</b>")).toBe(false);
    });
  });

  describe("sanitizeUserContent", () => {
    it("should sanitize and escape content", () => {
      const input = "  <script>alert()</script>  ";
      const result = sanitizeUserContent(input);
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize all string values", () => {
      const input = {
        name: "  John  ",
        email: "  TEST@EXAMPLE.COM  ",
        nested: {
          value: "  hello  ",
        },
      };

      const result = sanitizeObject(input);
      expect(result.name).toBe("John");
      expect(result.email).toBe("TEST@EXAMPLE.COM");
      expect(result.nested.value).toBe("hello");
    });

    it("should handle arrays", () => {
      const input = {
        tags: ["  tag1  ", "  tag2  "],
      };

      const result = sanitizeObject(input);
      expect(result.tags).toEqual(["tag1", "tag2"]);
    });

    it("should preserve non-string values", () => {
      const input = {
        count: 42,
        active: true,
        data: null,
      };

      const result = sanitizeObject(input);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });
  });
});
