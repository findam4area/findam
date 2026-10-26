import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Nigerian phone number patterns
 * Matches:
 * - +234XXXXXXXXXX (international format)
 * - 234XXXXXXXXXX (without +)
 * - 0XXXXXXXXXX (local format)
 * - XXXXXXXXXXX (11 digits starting with 0)
 */
const NIGERIAN_PHONE_PATTERNS = [
  /\+234\d{10}/g, // +234XXXXXXXXXX
  /\b234\d{10}\b/g, // 234XXXXXXXXXX
  /\b0\d{10}\b/g, // 0XXXXXXXXXX
];

/**
 * Detect phone numbers in text
 * Returns array of detected phone numbers
 */
export function detectPhoneNumbers(text: string): string[] {
  const phoneNumbers: string[] = [];
  const foundPositions: Array<{ start: number; end: number }> = [];

  NIGERIAN_PHONE_PATTERNS.forEach((pattern) => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach((match) => {
      const start = match.index!;
      const end = start + match[0].length;

      // Check if this position overlaps with any already found phone number
      const overlaps = foundPositions.some(
        (pos) =>
          (start >= pos.start && start < pos.end) ||
          (end > pos.start && end <= pos.end) ||
          (start <= pos.start && end >= pos.end),
      );

      if (!overlaps) {
        phoneNumbers.push(match[0]);
        foundPositions.push({ start, end });
      }
    });
  });

  // Remove duplicates
  return Array.from(new Set(phoneNumbers));
}

/**
 * Format Nigerian phone number to +234 format
 */
export function formatNigerianPhone(phone: string): string {
  try {
    // Remove any whitespace
    const cleaned = phone.replace(/\s/g, "");

    // Try to parse as Nigerian number
    const parsed = parsePhoneNumber(cleaned, "NG");

    if (parsed && parsed.isValid()) {
      return parsed.formatInternational(); // Returns +234 XXX XXX XXXX
    }

    // If parsing fails, try manual formatting
    if (cleaned.startsWith("+234")) {
      return cleaned;
    } else if (cleaned.startsWith("234")) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith("0")) {
      return `+234${cleaned.substring(1)}`;
    }

    return phone; // Return original if can't format
  } catch (error) {
    console.error("Error formatting phone number:", error);
    return phone;
  }
}

/**
 * Replace phone numbers in text with placeholder
 * Returns object with modified text and detected phone numbers
 */
export function hidePhoneNumbers(text: string): {
  text: string;
  phoneNumbers: string[];
} {
  const phoneNumbers = detectPhoneNumbers(text);

  if (phoneNumbers.length === 0) {
    return { text, phoneNumbers: [] };
  }

  let modifiedText = text;

  phoneNumbers.forEach((phone, index) => {
    // Replace each phone number with a unique placeholder
    modifiedText = modifiedText.replace(phone, `[PHONE_${index}]`);
  });

  return { text: modifiedText, phoneNumbers };
}

/**
 * Reveal phone numbers in text
 * Replaces placeholders with formatted phone numbers
 */
export function revealPhoneNumbers(
  text: string,
  phoneNumbers: string[],
): string {
  let revealedText = text;

  phoneNumbers.forEach((phone, index) => {
    const formatted = formatNigerianPhone(phone);
    revealedText = revealedText.replace(`[PHONE_${index}]`, formatted);
  });

  return revealedText;
}
