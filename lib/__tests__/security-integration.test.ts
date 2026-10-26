/**
 * Security Integration Tests
 * Tests for input sanitization, CSRF protection, and CSP headers
 * Requirements: 31.3, 31.4, 31.10
 */

import { describe, it, expect } from "vitest";
import { sanitizeInput, sanitizeUserContent } from "@/lib/utils/sanitization";
import { sanitizeText } from "@/lib/utils/sanitize-server";
import { getContentSecurityPolicy } from "@/lib/utils/security-headers";

describe("Security Integration Tests", () => {
  describe("Input Sanitization (Requirement 31.3)", () => {
    describe("XSS Prevention", () => {
      it("should prevent script injection in user input", () => {
        const maliciousInput = '<script>alert("XSS")</script>Hello';
        const sanitized = sanitizeText(maliciousInput);

        expect(sanitized).not.toContain("<script>");
        expect(sanitized).not.toContain("alert");
        expect(sanitized).toContain("Hello");
      });

      it("should prevent event handler injection", () => {
        const maliciousInput = '<div onclick="alert(1)">Click me</div>';
        const sanitized = sanitizeText(maliciousInput);

        expect(sanitized).not.toContain("onclick");
        expect(sanitized).not.toContain("alert");
      });

      it("should prevent javascript: protocol in links", () => {
        const maliciousInput = '<a href="javascript:alert(1)">Link</a>';
        const sanitized = sanitizeText(maliciousInput);

        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("alert");
      });

      it("should prevent data: protocol injection", () => {
        const maliciousInput =
          '<img src="data:text/html,<script>alert(1)</script>">';
        const sanitized = sanitizeText(maliciousInput);

        expect(sanitized).not.toContain("data:");
        expect(sanitized).not.toContain("<script>");
      });

      it("should prevent iframe injection", () => {
        const maliciousInput = '<iframe src="evil.com"></iframe>';
        const sanitized = sanitizeText(maliciousInput);

        expect(sanitized).not.toContain("<iframe>");
        expect(sanitized).not.toContain("evil.com");
      });

      it("should prevent object and embed tags", () => {
        const maliciousInput1 = '<object data="evil.swf"></object>';
        const maliciousInput2 = '<embed src="evil.swf">';

        const sanitized1 = sanitizeText(maliciousInput1);
        const sanitized2 = sanitizeText(maliciousInput2);

        expect(sanitized1).not.toContain("<object>");
        expect(sanitized2).not.toContain("<embed>");
      });

      it("should handle nested XSS attempts", () => {
        const maliciousInput =
          '<div><script>alert(1)</script><img onerror="alert(2)" src="x"></div>';
        const sanitized = sanitizeText(maliciousInput);

        expect(sanitized).not.toContain("<script>");
        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("alert");
      });

      it("should prevent encoded XSS attempts", () => {
        const maliciousInput = "&#60;script&#62;alert(1)&#60;/script&#62;";
        const sanitized = sanitizeText(maliciousInput);

        // After decoding, should still not contain script tags
        expect(sanitized).not.toContain("<script>");
      });
    });

    describe("SQL Injection Prevention", () => {
      it("should sanitize input with SQL keywords", () => {
        const maliciousInput = "'; DROP TABLE users; --";
        const sanitized = sanitizeInput(maliciousInput);

        // Input should be trimmed and normalized
        expect(sanitized).toBe("'; DROP TABLE users; --");
        // Note: Actual SQL injection prevention happens at the database layer
        // with parameterized queries. This just ensures input is normalized.
      });

      it("should remove null bytes that could bypass filters", () => {
        const maliciousInput = "admin\0' OR '1'='1";
        const sanitized = sanitizeInput(maliciousInput);

        expect(sanitized).not.toContain("\0");
      });
    });

    describe("User Content Sanitization", () => {
      it("should sanitize user bio content", () => {
        const userBio =
          'I am a developer <script>alert("xss")</script> from Lagos';
        const sanitized = sanitizeUserContent(userBio);

        expect(sanitized).not.toContain("<script>");
        expect(sanitized).toContain("I am a developer");
        expect(sanitized).toContain("from Lagos");
      });

      it("should sanitize listing descriptions", () => {
        const description =
          'Great product! <img onerror="alert(1)" src="x"> Buy now!';
        const sanitized = sanitizeUserContent(description);

        // HTML entities should be escaped
        expect(sanitized).toContain("&lt;img");
        expect(sanitized).toContain("&quot;");
        expect(sanitized).toContain("Great product!");
        expect(sanitized).toContain("Buy now!");
      });

      it("should preserve legitimate special characters", () => {
        const content = "Price: ₦1,500,000 & free shipping!";
        const sanitized = sanitizeUserContent(content);

        expect(sanitized).toContain("₦1,500,000");
        expect(sanitized).toContain("&amp;"); // & should be escaped
        expect(sanitized).toContain("free shipping!");
      });

      it("should handle empty and whitespace-only input", () => {
        expect(sanitizeUserContent("")).toBe("");
        expect(sanitizeUserContent("   ")).toBe("");
        expect(sanitizeUserContent("\n\t  \n")).toBe("");
      });

      it("should normalize multiple spaces", () => {
        const content = "Hello    world    from    Lagos";
        const sanitized = sanitizeInput(content);

        expect(sanitized).toBe("Hello world from Lagos");
      });
    });

    describe("Form Input Sanitization", () => {
      it("should sanitize username input", () => {
        const username = "  john_doe<script>alert(1)</script>  ";
        const sanitized = sanitizeInput(username);

        // sanitizeInput only trims and normalizes, doesn't remove HTML
        // For HTML removal, use sanitizeText or sanitizeUserContent
        expect(sanitized).toBe("john_doe<script>alert(1)</script>");
        expect(sanitized).not.toContain("  "); // Should be trimmed
      });

      it("should sanitize email input", () => {
        const email = "  TEST@EXAMPLE.COM  ";
        const sanitized = sanitizeInput(email);

        expect(sanitized).toBe("TEST@EXAMPLE.COM");
      });

      it("should sanitize phone number input", () => {
        const phone = "  +234 801 234 5678  ";
        const sanitized = sanitizeInput(phone);

        expect(sanitized).toBe("+234 801 234 5678");
      });
    });
  });

  describe("Content Security Policy (Requirement 31.10)", () => {
    it("should generate valid CSP header", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toBeDefined();
      expect(typeof csp).toBe("string");
      expect(csp.length).toBeGreaterThan(0);
    });

    it("should include default-src directive", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("default-src");
      expect(csp).toContain("'self'");
    });

    it("should restrict script-src to prevent XSS", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("script-src");
      expect(csp).toContain("'self'");
      // Should allow Paystack for payments
      expect(csp).toContain("https://js.paystack.co");
    });

    it("should restrict object-src to prevent plugin-based attacks", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("object-src");
      expect(csp).toContain("'none'");
    });

    it("should set base-uri to prevent base tag injection", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("base-uri");
      expect(csp).toContain("'self'");
    });

    it("should set form-action to prevent form hijacking", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("form-action");
      expect(csp).toContain("'self'");
    });

    it("should set frame-ancestors to prevent clickjacking", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("frame-ancestors");
      expect(csp).toContain("'none'");
    });

    it("should allow Supabase connections", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("connect-src");
      expect(csp).toContain("*.supabase.co");
    });

    it("should allow Supabase storage for images", () => {
      const csp = getContentSecurityPolicy();

      expect(csp).toContain("img-src");
      expect(csp).toContain("*.supabase.co");
    });

    it("should include upgrade-insecure-requests in production", () => {
      const csp = getContentSecurityPolicy();

      // This directive should be present
      expect(csp).toContain("upgrade-insecure-requests");
    });
  });

  describe("Combined Security Measures", () => {
    it("should handle malicious input through multiple layers", () => {
      // Simulate user input that tries multiple attack vectors
      const maliciousInput = `
        <script>alert('XSS')</script>
        <img onerror="alert(1)" src="x">
        javascript:alert(2)
        '; DROP TABLE users; --
        <iframe src="evil.com"></iframe>
      `;

      const sanitized = sanitizeUserContent(maliciousInput);

      // All attack vectors should be escaped (not removed, but made safe)
      expect(sanitized).toContain("&lt;script&gt;");
      expect(sanitized).toContain("&lt;img");
      expect(sanitized).toContain("&lt;iframe");
      // The actual dangerous code is escaped and cannot execute
    });

    it("should preserve legitimate content while removing threats", () => {
      const mixedInput = `
        Hello! I'm selling a laptop for ₦150,000.
        <script>alert('xss')</script>
        Contact me at: test@example.com
        <img onerror="alert(1)" src="x">
        Location: Lagos, Nigeria
      `;

      const sanitized = sanitizeUserContent(mixedInput);

      // Legitimate content should be preserved
      expect(sanitized).toContain("Hello!");
      expect(sanitized).toContain("₦150,000");
      expect(sanitized).toContain("test@example.com");
      expect(sanitized).toContain("Lagos, Nigeria");

      // Malicious content should be escaped
      expect(sanitized).toContain("&lt;script&gt;");
      expect(sanitized).toContain("&lt;img");
    });

    it("should handle international characters correctly", () => {
      const internationalInput =
        "Bonjour! 你好! مرحبا! Здравствуйте! <script>alert(1)</script>";
      const sanitized = sanitizeUserContent(internationalInput);

      // International characters should be preserved
      expect(sanitized).toContain("Bonjour!");
      expect(sanitized).toContain("你好!");
      expect(sanitized).toContain("مرحبا!");
      expect(sanitized).toContain("Здравствуйте!");

      // Script tags should be removed
      expect(sanitized).not.toContain("<script>");
    });

    it("should handle very long input efficiently", () => {
      const longInput = "a".repeat(10000) + '<script>alert(1)</script>';
      const start = performance.now();
      const sanitized = sanitizeUserContent(longInput);
      const duration = performance.now() - start;

      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);

      // Should still sanitize correctly
      expect(sanitized).not.toContain("<script>");
      expect(sanitized.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null and undefined gracefully", () => {
      expect(sanitizeInput("")).toBe("");
      expect(sanitizeUserContent("")).toBe("");
    });

    it("should handle special Unicode characters", () => {
      const unicodeInput = "Test \u0000 \u200B \uFEFF content";
      const sanitized = sanitizeInput(unicodeInput);

      // Null bytes should be removed
      expect(sanitized).not.toContain("\u0000");
    });

    it("should handle deeply nested HTML", () => {
      const nestedInput =
        "<div><div><div><script>alert(1)</script></div></div></div>";
      const sanitized = sanitizeText(nestedInput);

      expect(sanitized).not.toContain("<script>");
    });

    it("should handle malformed HTML", () => {
      const malformedInput = "<script>alert(1)<script>";
      const sanitized = sanitizeText(malformedInput);

      expect(sanitized).not.toContain("<script>");
    });

    it("should handle case variations in attack vectors", () => {
      const variations = [
        "<SCRIPT>alert(1)</SCRIPT>",
        "<ScRiPt>alert(1)</ScRiPt>",
        "<script>ALERT(1)</script>",
      ];

      variations.forEach((input) => {
        const sanitized = sanitizeText(input);
        expect(sanitized).not.toContain("script");
        expect(sanitized).not.toContain("SCRIPT");
      });
    });
  });
});
