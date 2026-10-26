import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Format Nigerian phone number to international format (+234)
 * @param phone - Phone number to format
 * @returns Formatted phone number in +234 format
 * @example formatNigerianPhone("08012345678") => "+234 801 234 5678"
 */
export function formatNigerianPhone(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone, "NG");
    return parsed.formatInternational();
  } catch (error) {
    return phone;
  }
}

/**
 * Validate Nigerian phone number
 * @param phone - Phone number to validate
 * @returns True if valid Nigerian phone number
 */
export function validateNigerianPhone(phone: string): boolean {
  try {
    return isValidPhoneNumber(phone, "NG");
  } catch (error) {
    return false;
  }
}

/**
 * Convert Nigerian phone number to E.164 format
 * @param phone - Phone number to convert
 * @returns Phone number in E.164 format (+234XXXXXXXXXX)
 * @example toE164("08012345678") => "+2348012345678"
 */
export function toE164(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone, "NG");
    return parsed.format("E.164");
  } catch (error) {
    return phone;
  }
}
