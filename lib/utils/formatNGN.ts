import numeral from "numeral";

/**
 * Format amount as Nigerian Naira (₦)
 * @param amount - Amount to format
 * @returns Formatted string with ₦ symbol
 * @example formatNGN(1500000) => "₦1,500,000"
 */
export function formatNGN(amount: number): string {
  return `₦${numeral(amount).format("0,0")}`;
}

/**
 * Format amount as Nigerian Naira with decimals
 * @param amount - Amount to format
 * @returns Formatted string with ₦ symbol and decimals
 * @example formatNGNWithDecimals(1500.50) => "₦1,500.50"
 */
export function formatNGNWithDecimals(amount: number): string {
  return `₦${numeral(amount).format("0,0.00")}`;
}

/**
 * Parse formatted NGN string back to number
 * @param formatted - Formatted NGN string
 * @returns Numeric value
 * @example parseNGN("₦1,500,000") => 1500000
 */
export function parseNGN(formatted: string): number {
  const cleaned = formatted.replace(/[₦,]/g, "");
  return numeral(cleaned).value() || 0;
}
