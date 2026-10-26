import { describe, it, expect } from "vitest";
import {
  detectPhoneNumbers,
  formatNigerianPhone,
  hidePhoneNumbers,
  revealPhoneNumbers,
} from "../phone-utils";

describe("phone-utils", () => {
  describe("detectPhoneNumbers", () => {
    it("should detect +234 format phone numbers", () => {
      const text = "Call me at +2348012345678";
      const phones = detectPhoneNumbers(text);
      expect(phones).toContain("+2348012345678");
    });

    it("should detect 234 format phone numbers", () => {
      const text = "My number is 2348012345678";
      const phones = detectPhoneNumbers(text);
      expect(phones).toContain("2348012345678");
    });

    it("should detect 0 prefix format phone numbers", () => {
      const text = "Contact: 08012345678";
      const phones = detectPhoneNumbers(text);
      expect(phones).toContain("08012345678");
    });

    it("should detect multiple phone numbers", () => {
      const text = "Call +2348012345678 or 08087654321";
      const phones = detectPhoneNumbers(text);
      expect(phones.length).toBe(2);
      expect(phones).toContain("+2348012345678");
      expect(phones).toContain("08087654321");
    });

    it("should return empty array when no phone numbers found", () => {
      const text = "No phone numbers here";
      const phones = detectPhoneNumbers(text);
      expect(phones).toEqual([]);
    });

    it("should remove duplicate phone numbers", () => {
      const text = "Call +2348012345678 or +2348012345678";
      const phones = detectPhoneNumbers(text);
      expect(phones.length).toBe(1);
    });
  });

  describe("formatNigerianPhone", () => {
    it("should format +234 format to international format", () => {
      const formatted = formatNigerianPhone("+2348012345678");
      expect(formatted).toMatch(/\+234/);
    });

    it("should format 234 format to international format", () => {
      const formatted = formatNigerianPhone("2348012345678");
      expect(formatted).toMatch(/\+234/);
    });

    it("should format 0 prefix format to international format", () => {
      const formatted = formatNigerianPhone("08012345678");
      expect(formatted).toMatch(/\+234/);
    });

    it("should return original if formatting fails", () => {
      const invalid = "invalid";
      const formatted = formatNigerianPhone(invalid);
      expect(formatted).toBe(invalid);
    });
  });

  describe("hidePhoneNumbers", () => {
    it("should hide phone numbers with placeholders", () => {
      const text = "Call me at +2348012345678";
      const result = hidePhoneNumbers(text);
      expect(result.text).toContain("[PHONE_0]");
      expect(result.text).not.toContain("+2348012345678");
      expect(result.phoneNumbers).toContain("+2348012345678");
    });

    it("should hide multiple phone numbers with unique placeholders", () => {
      const text = "Call +2348012345678 or 08087654321";
      const result = hidePhoneNumbers(text);
      expect(result.text).toContain("[PHONE_0]");
      expect(result.text).toContain("[PHONE_1]");
      expect(result.phoneNumbers.length).toBe(2);
    });

    it("should return original text when no phone numbers found", () => {
      const text = "No phone numbers here";
      const result = hidePhoneNumbers(text);
      expect(result.text).toBe(text);
      expect(result.phoneNumbers).toEqual([]);
    });

    it("should preserve surrounding text", () => {
      const text = "Before +2348012345678 after";
      const result = hidePhoneNumbers(text);
      expect(result.text).toContain("Before");
      expect(result.text).toContain("after");
    });
  });

  describe("revealPhoneNumbers", () => {
    it("should reveal phone numbers from placeholders", () => {
      const text = "Call me at [PHONE_0]";
      const phones = ["+2348012345678"];
      const revealed = revealPhoneNumbers(text, phones);
      expect(revealed).toContain("+234");
      expect(revealed).not.toContain("[PHONE_0]");
    });

    it("should reveal multiple phone numbers", () => {
      const text = "Call [PHONE_0] or [PHONE_1]";
      const phones = ["+2348012345678", "08087654321"];
      const revealed = revealPhoneNumbers(text, phones);
      expect(revealed).not.toContain("[PHONE_0]");
      expect(revealed).not.toContain("[PHONE_1]");
      expect(revealed).toContain("+234");
    });

    it("should format phone numbers when revealing", () => {
      const text = "[PHONE_0]";
      const phones = ["08012345678"]; // Local format
      const revealed = revealPhoneNumbers(text, phones);
      expect(revealed).toMatch(/\+234/); // Should be formatted to international
    });
  });

  describe("integration: hide and reveal", () => {
    it("should hide and then reveal phone numbers correctly", () => {
      const original = "Call me at +2348012345678 or 08087654321";
      const hidden = hidePhoneNumbers(original);
      const revealed = revealPhoneNumbers(hidden.text, hidden.phoneNumbers);

      // Should contain formatted phone numbers
      expect(revealed).toContain("+234");
      expect(revealed).not.toContain("[PHONE_");
    });
  });
});
