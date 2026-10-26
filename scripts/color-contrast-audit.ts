/**
 * Color Contrast Audit Script
 * 
 * Validates WCAG 2.1 Level AA color contrast requirements:
 * - Normal text (< 18pt or < 14pt bold): 4.5:1 minimum contrast ratio
 * - Large text (>= 18pt or >= 14pt bold): 3:1 minimum contrast ratio
 * - UI components and graphical objects: 3:1 minimum contrast ratio
 * 
 * Requirements: 15.3, 15.10
 */

interface ColorPair {
  name: string;
  foreground: string;
  background: string;
  usage: string;
  isLargeText?: boolean;
  isUIComponent?: boolean;
}

// Parse HSL color to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Parse hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Parse CSS color string to RGB
function parseColor(color: string): [number, number, number] {
  // Handle hex colors
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  // Handle hsl() format
  const hslMatch = color.match(/hsl\((\d+\.?\d*),?\s*(\d+\.?\d*)%?,?\s*(\d+\.?\d*)%?\)/);
  if (hslMatch) {
    return hslToRgb(
      parseFloat(hslMatch[1]),
      parseFloat(hslMatch[2]),
      parseFloat(hslMatch[3])
    );
  }

  // Handle HSL CSS variable format (e.g., "222.2 84% 4.9%")
  const hslVarMatch = color.match(/(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%/);
  if (hslVarMatch) {
    return hslToRgb(
      parseFloat(hslVarMatch[1]),
      parseFloat(hslVarMatch[2]),
      parseFloat(hslVarMatch[3])
    );
  }

  throw new Error(`Unsupported color format: ${color}`);
}

// Calculate relative luminance
function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio
function getContrastRatio(
  foreground: [number, number, number],
  background: [number, number, number]
): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast ratio passes WCAG AA
function passesWCAG_AA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

// CSS color definitions from globals.css
const cssColors = {
  background: "222.2 84% 4.9%", // Dark background
  foreground: "210 40% 98%", // Light text
  primary: "142 76% 36%", // Green
  "primary-foreground": "222.2 47.4% 11.2%", // Dark text on green
  secondary: "217.2 32.6% 17.5%", // Dark blue-gray
  "secondary-foreground": "210 40% 98%", // Light text
  muted: "217.2 32.6% 17.5%",
  "muted-foreground": "215 20.2% 65.1%", // Medium gray
  accent: "217.2 32.6% 17.5%",
  "accent-foreground": "210 40% 98%",
  destructive: "0 62.8% 30.6%", // Red
  "destructive-foreground": "210 40% 98%",
  border: "217.2 32.6% 40%",
  "naija-green": "#00C853",
  "naija-green-dark": "#007A34",
  "neon-cyan": "#15A3C7",
  "neon-orange": "#FF9900",
  "neon-orange-dark": "#B36200",
  "neon-pink": "#ff006e",
  "neon-purple": "#8338ec",
};

// Define color pairs to audit
const colorPairs: ColorPair[] = [
  // Body text
  {
    name: "Body text on background",
    foreground: cssColors.foreground,
    background: cssColors.background,
    usage: "Main content text",
    isLargeText: false,
  },
  // Primary button
  {
    name: "Primary button text",
    foreground: cssColors["primary-foreground"],
    background: cssColors.primary,
    usage: "CTA buttons (Browse, Sell)",
    isLargeText: false,
  },
  // Secondary elements
  {
    name: "Secondary text",
    foreground: cssColors["secondary-foreground"],
    background: cssColors.secondary,
    usage: "Secondary buttons, cards",
    isLargeText: false,
  },
  // Muted text
  {
    name: "Muted text on background",
    foreground: cssColors["muted-foreground"],
    background: cssColors.background,
    usage: "Helper text, timestamps",
    isLargeText: false,
  },
  // Links and interactive elements
  {
    name: "Primary links on background",
    foreground: cssColors["naija-green"],
    background: cssColors.background,
    usage: "Links, interactive elements",
    isLargeText: false,
  },
  // Accessible dark variant
  {
    name: "Dark green on white (light mode)",
    foreground: cssColors["naija-green-dark"],
    background: "0 0% 100%", // White
    usage: "Links on light backgrounds",
    isLargeText: false,
  },
  // Error/destructive elements
  {
    name: "Error text",
    foreground: cssColors["destructive-foreground"],
    background: cssColors.destructive,
    usage: "Error messages, delete buttons",
    isLargeText: false,
  },
  // Neon accents on dark background
  {
    name: "Neon cyan on dark",
    foreground: cssColors["neon-cyan"],
    background: cssColors.background,
    usage: "Accent elements, highlights",
    isUIComponent: true,
  },
  {
    name: "Neon orange on dark",
    foreground: cssColors["neon-orange"],
    background: cssColors.background,
    usage: "Warning badges, highlights",
    isUIComponent: true,
  },
  {
    name: "Neon orange dark on white",
    foreground: cssColors["neon-orange-dark"],
    background: "0 0% 100%",
    usage: "Warning badges on light backgrounds",
    isLargeText: false,
  },
  // Card backgrounds with text
  {
    name: "Card text",
    foreground: cssColors.foreground,
    background: "222.2 84% 4.9%", // Card background (same as body)
    usage: "Card content text",
    isLargeText: false,
  },
  // Border contrast for UI components
  {
    name: "Border visibility",
    foreground: cssColors.border,
    background: cssColors.background,
    usage: "Card borders, dividers",
    isUIComponent: true,
  },
  // Focus indicators
  {
    name: "Focus ring visibility",
    foreground: cssColors["naija-green"],
    background: cssColors.background,
    usage: "Keyboard focus indicators",
    isUIComponent: true,
  },
];

// Perform audit
function auditColorContrast(): void {
  console.log("=".repeat(80));
  console.log("COLOR CONTRAST AUDIT - WCAG 2.1 Level AA");
  console.log("Requirements: 15.3, 15.10");
  console.log("=".repeat(80));
  console.log();

  let totalPairs = 0;
  let passingPairs = 0;
  let failingPairs: string[] = [];

  colorPairs.forEach((pair) => {
    totalPairs++;

    const foregroundRGB = parseColor(pair.foreground);
    const backgroundRGB = parseColor(pair.background);
    const ratio = getContrastRatio(foregroundRGB, backgroundRGB);

    const minRequired = pair.isLargeText || pair.isUIComponent ? 3.0 : 4.5;
    const passes = pair.isUIComponent ? ratio >= 3.0 : passesWCAG_AA(ratio, pair.isLargeText);

    const status = passes ? "✓ PASS" : "✗ FAIL";
    const statusColor = passes ? "\x1b[32m" : "\x1b[31m";
    const resetColor = "\x1b[0m";

    console.log(`${statusColor}${status}${resetColor} ${pair.name}`);
    console.log(`  Usage: ${pair.usage}`);
    console.log(`  Ratio: ${ratio.toFixed(2)}:1 (min required: ${minRequired}:1)`);
    console.log(`  Type: ${pair.isLargeText ? "Large text" : pair.isUIComponent ? "UI component" : "Normal text"}`);
    console.log();

    if (passes) {
      passingPairs++;
    } else {
      failingPairs.push(pair.name);
    }
  });

  console.log("=".repeat(80));
  console.log(`SUMMARY: ${passingPairs}/${totalPairs} pairs passed`);

  if (failingPairs.length > 0) {
    console.log();
    console.log("\x1b[31mFailing pairs:\x1b[0m");
    failingPairs.forEach((name) => console.log(`  - ${name}`));
    console.log();
    console.log("\x1b[33mRecommendation:\x1b[0m Adjust colors to meet WCAG AA requirements.");
    process.exit(1);
  } else {
    console.log();
    console.log("\x1b[32m✓ All color pairs meet WCAG 2.1 Level AA requirements!\x1b[0m");
    console.log();
    console.log("Zoom compliance: Ensure browser zoom up to 200% is tested manually.");
    console.log("- Text should reflow without horizontal scrolling");
    console.log("- All functionality remains accessible");
    console.log("- No content is clipped or hidden");
  }
}

// Run audit
auditColorContrast();
