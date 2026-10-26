/**
 * Color Contrast Compliance Checker
 * Validates WCAG AA compliance (Requirements 15.3, 15.10)
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+/14pt+ bold): 3:1 contrast ratio
 * - Browser zoom support: up to 200%
 */

interface ColorPair {
  foreground: string;
  background: string;
  context: string;
  isLargeText?: boolean;
}

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
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Calculate relative luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number }
): number {
  const lum1 = getLuminance(fg.r, fg.g, fg.b);
  const lum2 = getLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
function meetsWCAG(ratio: number, isLargeText: boolean = false): {
  passes: boolean;
  level: "AAA" | "AA" | "FAIL";
} {
  if (isLargeText) {
    if (ratio >= 4.5) return { passes: true, level: "AAA" };
    if (ratio >= 3) return { passes: true, level: "AA" };
    return { passes: false, level: "FAIL" };
  } else {
    if (ratio >= 7) return { passes: true, level: "AAA" };
    if (ratio >= 4.5) return { passes: true, level: "AA" };
    return { passes: false, level: "FAIL" };
  }
}

/**
 * Color pairs to check from the project
 */
const colorPairsToCheck: ColorPair[] = [
  // Primary colors on dark background
  {
    foreground: "#00C853", // naija-green
    background: "#0a0a0f", // dark-bg
    context: "Primary green on dark background",
  },
  {
    foreground: "#15A3C7", // neon-cyan
    background: "#0a0a0f",
    context: "Neon cyan on dark background",
  },
  {
    foreground: "#FF9900", // neon-orange
    background: "#0a0a0f",
    context: "Neon orange on dark background",
  },
  {
    foreground: "#ff006e", // neon-pink
    background: "#0a0a0f",
    context: "Neon pink on dark background",
  },
  {
    foreground: "#8338ec", // neon-purple
    background: "#0a0a0f",
    context: "Neon purple on dark background",
  },

  // Text colors on dark background
  {
    foreground: "#ffffff", // white text
    background: "#0a0a0f", // dark-bg
    context: "White text on dark background",
  },
  {
    foreground: "#d1d5db", // gray-300
    background: "#0a0a0f",
    context: "Gray text on dark background (secondary)",
  },
  {
    foreground: "#9ca3af", // gray-400
    background: "#0a0a0f",
    context: "Gray text on dark background (muted)",
  },

  // Colors on card background
  {
    foreground: "#ffffff",
    background: "#1a1a2e", // dark-card
    context: "White text on dark card",
  },
  {
    foreground: "#00C853",
    background: "#1a1a2e",
    context: "Primary green on dark card",
  },

  // Accessible dark variants (Requirements 15.3)
  {
    foreground: "#ffffff",
    background: "#007A34", // naija-green-dark
    context: "White text on dark green (buttons)",
  },
  {
    foreground: "#ffffff",
    background: "#B36200", // neon-orange-dark
    context: "White text on dark orange (accents)",
  },

  // Tailwind color overrides (accessible variants)
  {
    foreground: "#ffffff",
    background: "#1e63d0", // blue-500 (accessible)
    context: "White on accessible blue",
  },
  {
    foreground: "#ffffff",
    background: "#047857", // green-500 (accessible)
    context: "White on accessible green",
  },
  {
    foreground: "#ffffff",
    background: "#b45309", // amber-500 (accessible)
    context: "White on accessible amber",
  },

  // Borders and subtle elements
  {
    foreground: "#2a2a3e", // dark-border
    background: "#0a0a0f", // dark-bg
    context: "Border on dark background",
  },
  {
    foreground: "#4b5563", // gray-600
    background: "#0a0a0f",
    context: "Subtle border on dark background",
  },
];

/**
 * Run contrast check
 */
function checkContrast() {
  console.log("🎨 Color Contrast Compliance Check\n");
  console.log("WCAG AA Requirements:");
  console.log("  - Normal text: 4.5:1 minimum contrast ratio");
  console.log("  - Large text: 3:1 minimum contrast ratio");
  console.log("  - Browser zoom: Must support up to 200%\n");
  console.log("=" .repeat(80) + "\n");

  const failures: ColorPair[] = [];
  const warnings: ColorPair[] = [];
  const passes: ColorPair[] = [];

  colorPairsToCheck.forEach((pair) => {
    const fg = hexToRgb(pair.foreground);
    const bg = hexToRgb(pair.background);

    if (!fg || !bg) {
      console.error(`❌ Invalid color format: ${pair.context}`);
      return;
    }

    const ratio = getContrastRatio(fg, bg);
    const result = meetsWCAG(ratio, pair.isLargeText);

    const statusIcon = result.passes ? "✅" : "❌";
    const textType = pair.isLargeText ? "Large Text" : "Normal Text";

    console.log(`${statusIcon} ${pair.context}`);
    console.log(`   Foreground: ${pair.foreground}`);
    console.log(`   Background: ${pair.background}`);
    console.log(`   Contrast: ${ratio.toFixed(2)}:1 (${result.level}) [${textType}]`);
    console.log();

    if (!result.passes) {
      failures.push(pair);
    } else if (result.level === "AA" && !pair.isLargeText) {
      warnings.push(pair);
    } else {
      passes.push(pair);
    }
  });

  console.log("=" .repeat(80));
  console.log("\n📊 Summary:");
  console.log(`✅ Passed: ${passes.length}`);
  console.log(`⚠️  Warnings (AA but not AAA): ${warnings.length}`);
  console.log(`❌ Failed: ${failures.length}\n`);

  if (failures.length > 0) {
    console.log("❌ FAILED - The following color pairs do not meet WCAG AA:");
    failures.forEach((pair) => {
      console.log(`   - ${pair.context}`);
    });
    console.log();
  }

  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS - The following meet AA but not AAA:");
    warnings.forEach((pair) => {
      console.log(`   - ${pair.context}`);
    });
    console.log();
  }

  console.log("\n✨ Recommendations:");
  console.log("1. Use accessible color variants defined in Tailwind config");
  console.log("2. Test with browser zoom at 200% (Ctrl/Cmd + +)");
  console.log("3. Use naija-green-dark and neon-orange-dark for buttons");
  console.log("4. Ensure text-gray-300 or lighter for secondary text");
  console.log("5. Use accessible blue-500, green-500, amber-500 variants\n");

  return { failures, warnings, passes };
}

// Run the check
if (require.main === module) {
  const results = checkContrast();
  process.exit(results.failures.length > 0 ? 1 : 0);
}

export { checkContrast, getContrastRatio, meetsWCAG, hexToRgb };
