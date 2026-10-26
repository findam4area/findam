/**
 * Color Contrast Utility
 * 
 * Provides functions for calculating WCAG 2.1 contrast ratios and validating
 * color accessibility compliance.
 * 
 * Requirements: 15.3 (contrast ratios), 15.10 (zoom support)
 * 
 * WCAG 2.1 Level AA Standards:
 * - Normal text: 4.5:1 minimum contrast ratio
 * - Large text (18pt+ or 14pt+ bold): 3:1 minimum contrast ratio
 */

/**
 * Color palette from tailwind.config.ts and globals.css
 */
export const COLOR_PALETTE = {
  // Background colors
  backgrounds: {
    "dark-bg": "#0a0a0f",
    "dark-card": "#1a1a2e",
    "dark-border": "#2a2a3e",
    "gray-900": "#0f172a",
    "gray-800": "#1e293b",
    "gray-700": "#334155",
  },
  
  // Text colors
  text: {
    white: "#ffffff",
    "gray-100": "#f1f5f9",
    "gray-200": "#e2e8f0",
    "gray-300": "#cbd5e1",
    "gray-400": "#94a3b8",
    "gray-500": "#64748b",
  },
  
  // Brand colors
  brand: {
    "naija-green": "#00C853",
    "neon-cyan": "#15A3C7",
    "neon-orange": "#FF9900",
    "neon-pink": "#ff006e",
    "neon-purple": "#8338ec",
  },
  
  // Semantic colors
  semantic: {
    "yellow-500": "#eab308",
    "red-500": "#ef4444",
    "blue-500": "#1e63d0",
    "green-500": "#047857",
    "amber-500": "#b45309",
  },
} as const;

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");
  
  // Parse hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  if (hex.length !== 6) {
    return null;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }
  
  return { r, g, b };
}

/**
 * Convert HSL color to RGB values
 * HSL format: "hsl(142, 76%, 36%)" or "142 76% 36%"
 */
export function hslToRgb(hsl: string): { r: number; g: number; b: number } | null {
  // Extract h, s, l values
  const match = hsl.match(/(\d+)\s*,?\s*(\d+)%?\s*,?\s*(\d+)%?/);
  if (!match) return null;
  
  let h = parseInt(match[1]);
  let s = parseInt(match[2]) / 100;
  let l = parseInt(match[3]) / 100;
  
  // Normalize hue to 0-1 range
  h = h / 360;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Parse color string to RGB
 * Supports hex (#ffffff), hsl(h, s%, l%), and rgb(r, g, b) formats
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  color = color.trim();
  
  // Hex color
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }
  
  // HSL color
  if (color.startsWith("hsl")) {
    return hslToRgb(color);
  }
  
  // RGB color
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }
  
  return null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  // Normalize RGB values to 0-1 range
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance using sRGB coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a ratio between 1 and 21
 * 
 * @param color1 - First color (hex, rgb, or hsl)
 * @param color2 - Second color (hex, rgb, or hsl)
 * @returns Contrast ratio or null if colors are invalid
 */
export function calculateContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) {
    return null;
  }
  
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  
  // WCAG formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard for normal text (4.5:1)
 */
export function meetsNormalTextAA(color1: string, color2: string): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return ratio !== null && ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AA standard for large text (3:1)
 * Large text is 18pt+ or 14pt+ bold
 */
export function meetsLargeTextAA(color1: string, color2: string): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return ratio !== null && ratio >= 3.0;
}

/**
 * Check if contrast ratio meets WCAG AAA standard for normal text (7:1)
 */
export function meetsNormalTextAAA(color1: string, color2: string): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return ratio !== null && ratio >= 7.0;
}

/**
 * Check if contrast ratio meets WCAG AAA standard for large text (4.5:1)
 */
export function meetsLargeTextAAA(color1: string, color2: string): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return ratio !== null && ratio >= 4.5;
}

/**
 * Result of a contrast check
 */
export interface ContrastCheckResult {
  textColor: string;
  backgroundColor: string;
  ratio: number;
  meetsNormalTextAA: boolean;
  meetsLargeTextAA: boolean;
  meetsNormalTextAAA: boolean;
  meetsLargeTextAAA: boolean;
  recommendation?: string;
}

/**
 * Comprehensive contrast check with recommendations
 */
export function checkContrast(textColor: string, backgroundColor: string): ContrastCheckResult | null {
  const ratio = calculateContrastRatio(textColor, backgroundColor);
  
  if (ratio === null) {
    return null;
  }
  
  const normalAA = ratio >= 4.5;
  const largeAA = ratio >= 3.0;
  const normalAAA = ratio >= 7.0;
  const largeAAA = ratio >= 4.5;
  
  let recommendation: string | undefined;
  
  if (!normalAA) {
    recommendation = `⚠️ FAIL: Contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AA for normal text (requires 4.5:1)`;
  } else if (!normalAAA) {
    recommendation = `✓ PASS AA: Meets WCAG AA (${ratio.toFixed(2)}:1) but not AAA for normal text`;
  } else {
    recommendation = `✓✓ PASS AAA: Excellent contrast (${ratio.toFixed(2)}:1) meets WCAG AAA`;
  }
  
  return {
    textColor,
    backgroundColor,
    ratio,
    meetsNormalTextAA: normalAA,
    meetsLargeTextAA: largeAA,
    meetsNormalTextAAA: normalAAA,
    meetsLargeTextAAA: largeAAA,
    recommendation,
  };
}

/**
 * Test all common color combinations in the app
 */
export function testAllColorCombinations(): ContrastCheckResult[] {
  const results: ContrastCheckResult[] = [];
  
  // Common text/background combinations
  const combinations: Array<{ text: string; bg: string; context: string }> = [
    // Primary dark backgrounds with light text
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "White text on dark-bg" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds["dark-card"], context: "White text on dark-card" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds["gray-900"], context: "White text on gray-900" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds["gray-800"], context: "White text on gray-800" },
    
    // Gray text on dark backgrounds (common for secondary text)
    { text: COLOR_PALETTE.text["gray-100"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Gray-100 text on dark-bg" },
    { text: COLOR_PALETTE.text["gray-200"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Gray-200 text on dark-bg" },
    { text: COLOR_PALETTE.text["gray-300"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Gray-300 text on dark-bg" },
    { text: COLOR_PALETTE.text["gray-400"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Gray-400 text on dark-bg" },
    { text: COLOR_PALETTE.text["gray-400"], bg: COLOR_PALETTE.backgrounds["dark-card"], context: "Gray-400 text on dark-card" },
    
    // Brand colors on dark backgrounds
    { text: COLOR_PALETTE.brand["naija-green"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Naija-green on dark-bg" },
    { text: COLOR_PALETTE.brand["naija-green"], bg: COLOR_PALETTE.backgrounds["dark-card"], context: "Naija-green on dark-card" },
    { text: COLOR_PALETTE.brand["neon-cyan"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Neon-cyan on dark-bg" },
    { text: COLOR_PALETTE.brand["neon-orange"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Neon-orange on dark-bg" },
    { text: COLOR_PALETTE.brand["neon-pink"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Neon-pink on dark-bg" },
    { text: COLOR_PALETTE.brand["neon-purple"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Neon-purple on dark-bg" },
    
    // Semantic colors on dark backgrounds
    { text: COLOR_PALETTE.semantic["yellow-500"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Yellow-500 on dark-bg" },
    { text: COLOR_PALETTE.semantic["red-500"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Red-500 on dark-bg" },
    { text: COLOR_PALETTE.semantic["blue-500"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Blue-500 on dark-bg (accessible)" },
    { text: COLOR_PALETTE.semantic["green-500"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Green-500 on dark-bg (accessible)" },
    { text: COLOR_PALETTE.semantic["amber-500"], bg: COLOR_PALETTE.backgrounds["dark-bg"], context: "Amber-500 on dark-bg (accessible)" },
    
    // White text on brand colors (buttons, badges)
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.brand["naija-green"], context: "White on naija-green button" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.brand["neon-cyan"], context: "White on neon-cyan" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.brand["neon-orange"], context: "White on neon-orange" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.semantic["red-500"], context: "White on red-500 (error)" },
    { text: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.semantic["blue-500"], context: "White on blue-500" },
    
    // Dark text on brand color backgrounds (alerts, tags)
    { text: COLOR_PALETTE.backgrounds["dark-bg"], bg: COLOR_PALETTE.brand["naija-green"], context: "Dark text on naija-green" },
    { text: COLOR_PALETTE.backgrounds["dark-bg"], bg: COLOR_PALETTE.brand["neon-cyan"], context: "Dark text on neon-cyan" },
    { text: COLOR_PALETTE.backgrounds["dark-bg"], bg: COLOR_PALETTE.semantic["yellow-500"], context: "Dark text on yellow-500" },
  ];
  
  for (const combo of combinations) {
    const result = checkContrast(combo.text, combo.bg);
    if (result) {
      results.push({
        ...result,
        recommendation: `${combo.context}: ${result.recommendation}`,
      });
    }
  }
  
  return results;
}

/**
 * Format contrast check results as a readable report
 */
export function formatContrastReport(results: ContrastCheckResult[]): string {
  const lines: string[] = [];
  
  lines.push("=".repeat(80));
  lines.push("COLOR CONTRAST ACCESSIBILITY REPORT");
  lines.push("WCAG 2.1 Level AA Compliance Check");
  lines.push("=".repeat(80));
  lines.push("");
  
  const passing = results.filter(r => r.meetsNormalTextAA);
  const failing = results.filter(r => !r.meetsNormalTextAA);
  
  lines.push(`Summary: ${passing.length}/${results.length} combinations pass WCAG AA for normal text`);
  lines.push("");
  
  if (failing.length > 0) {
    lines.push("❌ FAILING COMBINATIONS (require fixes):");
    lines.push("-".repeat(80));
    for (const result of failing) {
      lines.push(result.recommendation || "");
      lines.push(`   Text: ${result.textColor}`);
      lines.push(`   Background: ${result.backgroundColor}`);
      lines.push("");
    }
  }
  
  lines.push("✓ PASSING COMBINATIONS:");
  lines.push("-".repeat(80));
  for (const result of passing) {
    lines.push(result.recommendation || "");
  }
  
  lines.push("");
  lines.push("=".repeat(80));
  lines.push("STANDARDS REFERENCE:");
  lines.push("- Normal text (< 18pt / < 14pt bold): 4.5:1 minimum (WCAG AA)");
  lines.push("- Large text (≥ 18pt / ≥ 14pt bold): 3:1 minimum (WCAG AA)");
  lines.push("- AAA standards: 7:1 (normal) / 4.5:1 (large)");
  lines.push("=".repeat(80));
  
  return lines.join("\n");
}
