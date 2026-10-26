/**
 * Script to run color contrast tests and generate report
 * 
 * Usage: npx tsx scripts/test-color-contrast.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { generateReport, logContrastTestResults } from '../lib/utils/test-color-contrast';

function main() {
  console.log('Running color contrast accessibility tests...\n');
  
  // Log results to console
  logContrastTestResults();
  
  // Generate detailed report
  const report = generateReport();
  
  // Write report to file
  const reportPath = join(process.cwd(), 'COLOR_CONTRAST_REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`\n✅ Detailed report saved to: ${reportPath}\n`);
}

main();
