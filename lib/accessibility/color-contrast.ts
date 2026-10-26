/**
 * Color Contrast Utilities for WCAG 2.1 Level AA Compliance
 * 
 * Requirements: 15.3, 15.10
 * 
 * WCAG 2.1 Level AA requires:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (>=18pt or >=14pt bold): 3:1 contrast ratio
 * - UI components and graphical objects: 3:1 contrast ratio
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to relative luminance
 * Based on WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors (e.g., #FFFFFF)');
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG 2.1 Level AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  passes: boolean;
  requiredRatio: number;
  level: 'AA' | 'AAA' | 'FAIL';
} {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3.0 : 4.5;
  const aaaRequiredRatio = isLargeText ? 4.5 : 7.0;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= requiredRatio,
    requiredRatio,
    level: ratio >= aaaRequiredRatio ? 'AAA' : ratio >= requiredRatio ? 'AA' : 'FAIL',
  };
}

/**
 * Validate all text color combinations in the design system
 */
export const COLOR_PALETTE = {
  // Background colors
  backgrounds: {
    'gray-900': '#111827',
    'dark-bg': '#0a0a0f',
    'dark-card': '#1a1a2e',
    white: '#FFFFFF',
  },
  // Text colors
  text: {
    white: '#FFFFFF',
    'gray-100': '#F3F4F6',
    'gray-200': '#E5E7EB',
    'gray-300': '#D1D5DB',
    'gray-400': '#9CA3AF',
    'naija-green': '#00C853',
    'neon-cyan': '#15A3C7',
    'neon-orange': '#FF9900',
    'neon-purple': '#8338ec',
    'neon-pink': '#ff006e',
  },
};

/**
 * Check all color combinations and return violations
 */
export function validateColorCombinations(): Array<{
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
  requiredRatio: number;
}> {
  const violations: Array<{
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
    requiredRatio: number;
  }> = [];

  // Common combinations used in the app
  const combinations = [
    // Main page backgrounds
    { fg: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: false },
    { fg: COLOR_PALETTE.text['gray-300'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: false },
    { fg: COLOR_PALETTE.text['gray-400'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: false },
    
    // Card backgrounds
    { fg: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds['dark-card'], isLarge: false },
    { fg: COLOR_PALETTE.text['gray-300'], bg: COLOR_PALETTE.backgrounds['dark-card'], isLarge: false },
    
    // Accent colors on dark backgrounds
    { fg: COLOR_PALETTE.text['naija-green'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: false },
    { fg: COLOR_PALETTE.text['neon-cyan'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: false },
    { fg: COLOR_PALETTE.text['neon-orange'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: false },
    
    // Buttons and links
    { fg: COLOR_PALETTE.backgrounds.white, bg: COLOR_PALETTE.text['naija-green'], isLarge: false },
    { fg: COLOR_PALETTE.backgrounds['gray-900'], bg: COLOR_PALETTE.text['naija-green'], isLarge: false },
    
    // Large text (headings >= 18pt)
    { fg: COLOR_PALETTE.text.white, bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: true },
    { fg: COLOR_PALETTE.text['gray-200'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: true },
    { fg: COLOR_PALETTE.text['naija-green'], bg: COLOR_PALETTE.backgrounds['gray-900'], isLarge: true },
  ];

  combinations.forEach(({ fg, bg, isLarge }) => {
    const result = meetsWCAGAA(fg, bg, isLarge);
    if (!result.passes) {
      violations.push({
        foreground: fg,
        background: bg,
        ratio: result.ratio,
        passes: result.passes,
        requiredRatio: result.requiredRatio,
      });
    }
  });

  return violations;
}

/**
 * Get accessible text color for a given background
 */
export function getAccessibleTextColor(background: string): string {
  const whiteRatio = getContrastRatio('#FFFFFF', background);
  const blackRatio = getContrastRatio('#000000', background);

  // Return white if it has better contrast, otherwise black
  return whiteRatio > blackRatio ? '#FFFFFF' : '#000000';
}

/**
 * Suggest alternative colors to fix contrast issues
 */
export function suggestAlternativeColor(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  original: { foreground: string; background: string; ratio: number };
  suggestions: Array<{ color: string; ratio: number; passes: boolean }>;
} {
  const originalRatio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3.0 : 4.5;

  // Try lightening or darkening the foreground color
  const suggestions: Array<{ color: string; ratio: number; passes: boolean }> = [];

  // Suggest pure white or black as fallbacks
  const whiteRatio = getContrastRatio('#FFFFFF', background);
  if (whiteRatio >= requiredRatio) {
    suggestions.push({ color: '#FFFFFF', ratio: whiteRatio, passes: true });
  }

  const blackRatio = getContrastRatio('#000000', background);
  if (blackRatio >= requiredRatio) {
    suggestions.push({ color: '#000000', ratio: blackRatio, passes: true });
  }

  // Suggest lighter grays
  const lightGrays = ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF'];
  lightGrays.forEach((gray) => {
    const ratio = getContrastRatio(gray, background);
    if (ratio >= requiredRatio) {
      suggestions.push({ color: gray, ratio, passes: true });
    }
  });

  return {
    original: { foreground, background, ratio: originalRatio },
    suggestions: suggestions.slice(0, 3), // Return top 3 suggestions
  };
}
