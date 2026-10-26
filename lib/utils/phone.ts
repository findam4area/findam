// Phone number formatting utilities for Nigerian numbers
// Uses libphonenumber-js for +234 format validation and formatting

import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Format a Nigerian phone number to international +234 format
 * Requirements: 21.6
 * @param phone - Phone number in any format
 * @returns Formatted phone number in +234 format
 */
export function formatNigerianPhone(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone, "NG");
    return parsed.formatInternational(); // +234 XXX XXX XXXX
  } catch (error) {
    // If parsing fails, try to clean and format manually
    const cleaned = phone.replace(/\D/g, "");

    // If it starts with 234, add +
    if (cleaned.startsWith("234")) {
      return `+${cleaned}`;
    }

    // If it starts with 0, replace with +234
    if (cleaned.startsWith("0")) {
      return `+234${cleaned.substring(1)}`;
    }

    // Otherwise, assume it needs +234 prefix
    return `+234${cleaned}`;
  }
}

/**
 * Validate if a phone number is a valid Nigerian number
 * Requirements: 21.6
 * @param phone - Phone number to validate
 * @returns true if valid Nigerian number
 */
export function validateNigerianPhone(phone: string): boolean {
  try {
    return isValidPhoneNumber(phone, "NG");
  } catch (error) {
    return false;
  }
}

/**
 * Mask a phone number for privacy (show only last 4 digits)
 * @param phone - Phone number to mask
 * @returns Masked phone number (e.g., +234 XXX XXX 1234)
 */
export function maskPhoneNumber(phone: string): string {
  const formatted = formatNigerianPhone(phone);
  const parts = formatted.split(" ");

  if (parts.length >= 4) {
    return `${parts[0]} XXX XXX ${parts[parts.length - 1]}`;
  }

  // Fallback masking
  return formatted.substring(0, formatted.length - 4).replace(/\d/g, "X") + formatted.substring(formatted.length - 4);
}
