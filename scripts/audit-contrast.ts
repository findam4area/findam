#!/usr/bin/env tsx
/**
 * Color Contrast Audit Runner
 * 
 * Runs comprehensive WCAG AA color contrast audit and saves results.
 * 
 * Usage:
 *   npm run audit:contrast
 *   or
 *   npx tsx scripts/audit-contrast.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { runFullAudit } from "../lib/utils/color-contrast-audit";

console.log("🎨 Starting color contrast audit...\n");

try {
  const report = runFullAudit();
  
  // Print to console
  console.log(report);
  
  // Save to file
  const outputPath = join(process.cwd(), "color-contrast-audit-report.txt");
  writeFileSync(outputPath, report, "utf-8");
  
  console.log(`\n✅ Audit complete! Report saved to: ${outputPath}`);
} catch (error) {
  console.error("❌ Error running audit:", error);
  process.exit(1);
}
