/**
 * Quick Performance Check Script
 * 
 * Quick verification that key performance optimizations are in place
 * 
 * Task: 10.15 - Performance optimization and Lighthouse audit
 * Requirements: 11.5, 11.8
 * 
 * Usage:
 *   npx tsx scripts/quick-performance-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

function checkFile(filePath: string, pattern: RegExp, checkName: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      name: checkName,
      status: 'fail',
      message: `File not found: ${filePath}`,
    });
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const hasPattern = pattern.test(content);

  if (hasPattern) {
    results.push({
      name: checkName,
      status: 'pass',
      message: `✅ ${checkName}`,
    });
    return true;
  } else {
    results.push({
      name: checkName,
      status: 'fail',
      message: `❌ ${checkName} - Pattern not found`,
    });
    return false;
  }
}

function checkFileExists(filePath: string, checkName: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    results.push({
      name: checkName,
      status: 'pass',
      message: `✅ ${checkName}`,
    });
    return true;
  } else {
    results.push({
      name: checkName,
      status: 'fail',
      message: `❌ ${checkName} - File not found: ${filePath}`,
    });
    return false;
  }
}

async function main() {
  console.log('🔍 Running Quick Performance Check...\n');

  // Check 1: ISR on homepage
  checkFile(
    'app/page.tsx',
    /export\s+const\s+revalidate\s*=\s*3600/,
    'ISR on Homepage (revalidate: 3600)'
  );

  // Check 2: ISR on browse page
  checkFile(
    'app/(public)/browse/page.tsx',
    /export\s+const\s+revalidate\s*=\s*3600/,
    'ISR on Browse Page (revalidate: 3600)'
  );

  // Check 3: Image optimization config
  checkFile(
    'next.config.ts',
    /formats:\s*\["image\/webp",\s*"image\/avif"\]/,
    'Image Format Optimization (WebP/AVIF)'
  );

  // Check 4: Bundle optimization
  checkFile(
    'next.config.ts',
    /optimizePackageImports/,
    'Package Import Optimization'
  );

  // Check 5: Code splitting
  checkFile(
    'next.config.ts',
    /splitChunks/,
    'Webpack Code Splitting'
  );

  // Check 6: PWA configuration
  checkFile(
    'next.config.ts',
    /workboxOptions/,
    'PWA Service Worker Configuration'
  );

  // Check 7: Lighthouse config
  checkFileExists('.lighthouserc.js', 'Lighthouse CI Configuration');

  // Check 8: Performance documentation
  checkFileExists('PERFORMANCE_OPTIMIZATION.md', 'Performance Documentation');

  // Check 9: Lighthouse audit script
  checkFileExists('scripts/lighthouse-audit.ts', 'Lighthouse Audit Script');

  // Check 10: Bundle analyzer script
  checkFileExists('scripts/analyze-bundle.ts', 'Bundle Analyzer Script');

  // Print results
  console.log('\n📊 Performance Check Results\n');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warning').length;

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.status !== 'pass') {
      console.log(`   ${result.message}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal: ${results.length} checks`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);

  if (failed === 0) {
    console.log('\n🎉 All performance optimizations are in place!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run "npm run lighthouse:audit" to measure performance');
    console.log('   2. Run "npm run analyze" to check bundle size');
    console.log('   3. Review PERFORMANCE_OPTIMIZATION.md for details');
  } else {
    console.log('\n⚠️  Some performance optimizations are missing.');
    console.log('   Please review the failed checks and implement the missing optimizations.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
