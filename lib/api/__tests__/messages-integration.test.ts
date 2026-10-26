import { describe, it, expect } from "vitest";
import {
  detectPhoneNumbers,
  hidePhoneNumbers,
  revealPhoneNumbers,
  formatNigerianPhone,
} from "@/lib/utils/phone-utils";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Initialize DOMPurify
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

describe("Messaging Integration Tests (Requirements 6.9, 6.10, 6.11)", () => {
  describe("Complete message flow: sanitization + phone hiding + revealing", () => {
    it("should sanitize, hide, and reveal phone numbers in a message", () => {
      // Simulate a message with HTML and phone number
      const originalMessage =
        '<script>alert("XSS")</script>Call me at +2348012345678';

      // Step 1: Sanitize (Requirement 6.9)
      const sanitized = purify.sanitize(originalMessage, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("Call me at +2348012345678");

      // Step 2: Hide phone numbers (Requirement 6.10)
      const { text: hidden, phoneNumbers } = hidePhoneNumbers(sanitized);

      expect(hidden).toContain("[PHONE_0]");
      expect(hidden).not.toContain("+2348012345678");
      expect(phoneNumbers).toContain("+2348012345678");

      // Step 3: Reveal phone numbers with formatting (Requirement 6.11)
      const revealed = revealPhoneNumbers(hidden, phoneNumbers);

      expect(revealed).toContain("+234");
      expect(revealed).not.toContain("[PHONE_0]");
    });

    it("should handle multiple phone numbers with sanitization", () => {
      const message =
        "<p>Contact: +2348012345678 or <strong>08087654321</strong></p>";

      // Sanitize
      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<p>");
      expect(sanitized).not.toContain("<strong>");

      // Hide phones
      const { text: hidden, phoneNumbers } = hidePhoneNumbers(sanitized);

      expect(phoneNumbers.length).toBe(2);
      expect(hidden).toContain("[PHONE_0]");
      expect(hidden).toContain("[PHONE_1]");

      // Reveal phones
      const revealed = revealPhoneNumbers(hidden, phoneNumbers);

      expect(revealed).toContain("+234");
      expect(revealed).not.toContain("[PHONE_");
    });

    it("should preserve message content without phone numbers", () => {
      const message = "<div>Hello, how are you?</div>";

      // Sanitize
      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).toBe("Hello, how are you?");

      // Hide phones (should find none)
      const { text: hidden, phoneNumbers } = hidePhoneNumbers(sanitized);

      expect(phoneNumbers.length).toBe(0);
      expect(hidden).toBe(sanitized);
    });

    it("should handle Nigerian local format phone numbers", () => {
      const message = "My number is 08012345678";

      // Sanitize (no HTML)
      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      // Hide
      const { text: hidden, phoneNumbers } = hidePhoneNumbers(sanitized);

      expect(phoneNumbers).toContain("08012345678");
      expect(hidden).toContain("[PHONE_0]");

      // Reveal with formatting to +234
      const revealed = revealPhoneNumbers(hidden, phoneNumbers);

      expect(revealed).toContain("+234");
      expect(revealed).not.toContain("08012345678"); // Should be formatted
    });

    it("should handle complex message with multiple security concerns", () => {
      const message = `
        <script>alert('XSS')</script>
        <img src=x onerror="alert(1)">
        Call me at +2348012345678 or 08087654321
        <iframe src="evil.com"></iframe>
        Price: ₦1,500
      `;

      // Sanitize
      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("<img");
      expect(sanitized).not.toContain("<iframe>");
      expect(sanitized).not.toContain("onerror");
      expect(sanitized).toContain("₦1,500"); // Preserve special chars

      // Hide phones
      const { text: hidden, phoneNumbers } = hidePhoneNumbers(sanitized);

      expect(phoneNumbers.length).toBe(2);
      expect(hidden).toContain("[PHONE_0]");
      expect(hidden).toContain("[PHONE_1]");

      // Reveal
      const revealed = revealPhoneNumbers(hidden, phoneNumbers);

      expect(revealed).toContain("+234");
      expect(revealed).toContain("₦1,500");
    });
  });

  describe("Phone number formatting (Requirement 6.11)", () => {
    it("should format all Nigerian phone formats to +234", () => {
      const formats = [
        { input: "+2348012345678", expected: "+234" },
        { input: "2348012345678", expected: "+234" },
        { input: "08012345678", expected: "+234" },
      ];

      formats.forEach(({ input, expected }) => {
        const formatted = formatNigerianPhone(input);
        expect(formatted).toContain(expected);
      });
    });

    it("should format phone numbers when revealing", () => {
      const localFormat = "08012345678";
      const { text, phoneNumbers } = hidePhoneNumbers(`Call ${localFormat}`);

      const revealed = revealPhoneNumbers(text, phoneNumbers);

      // Should be formatted to international format
      expect(revealed).toContain("+234");
      expect(revealed).not.toContain("08012345678");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty messages", () => {
      const message = "";

      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });
      const { text, phoneNumbers } = hidePhoneNumbers(sanitized);

      expect(text).toBe("");
      expect(phoneNumbers.length).toBe(0);
    });

    it("should handle messages with only HTML", () => {
      const message = "<div><p><span></span></p></div>";

      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).toBe("");
    });

    it("should handle messages with special characters and emojis", () => {
      const message = "Hello 👋 Price: ₦1,500 & more! 🎉";

      const sanitized = purify.sanitize(message, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).toContain("👋");
      expect(sanitized).toContain("₦");
      expect(sanitized).toContain("🎉");
    });

    it("should handle phone numbers at different positions", () => {
      const messages = [
        "+2348012345678 at the start",
        "In the middle +2348012345678 here",
        "At the end +2348012345678",
      ];

      messages.forEach((msg) => {
        const { phoneNumbers } = hidePhoneNumbers(msg);
        expect(phoneNumbers.length).toBe(1);
        expect(phoneNumbers[0]).toBe("+2348012345678");
      });
    });
  });
});
