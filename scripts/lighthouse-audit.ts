/**
 * Lighthouse Performance Audit Script
 * 
 * Runs Lighthouse audits on key pages to measure performance metrics
 * 
 * Task: 10.15 - Performance optimization and Lighthouse audit
 * Requirements: 11.5, 11.8
 * 
 * Target Metrics:
 * - LCP < 2.5s (Largest Contentful Paint)
 * - FID < 100ms (First Input Delay)
 * - CLS < 0.1 (Cumulative Layout Shift)
 * - Performance Score: 90+
 * - Accessibility Score: 95+
 * - Best Practices Score: 90+
 * - SEO Score: 95+
 * 
 * Usage:
 *   npm run lighthouse
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface LighthouseResult {
  url: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    fcp: number;
    lcp: number;
    cls: number;
    tbt: number;
    tti: number;
  };
}

const URLS_TO_TEST = [
  { url: 'http://localhost:3000', name: 'Homepage' },
  { url: 'http://localhost:3000/browse', name: 'Browse Page' },
  { url: 'http://localhost:3000/categories', name: 'Categories Page' },
];

const LIGHTHOUSE_FLAGS = [
  '--chrome-flags="--headless"',
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=json',
  '--output-path=./lighthouse-reports/report.json',
].join(' ');

async function runLighthouseAudit(url: string, name: string): Promise<LighthouseResult | null> {
  console.log(`\n🔍 Running Lighthouse audit for ${name}...`);
  console.log(`   URL: ${url}\n`);

  try {
    // Ensure lighthouse-reports directory exists
    const reportsDir = path.join(process.cwd(), 'lighthouse-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Run Lighthouse using the CLI
    execSync(`npx lighthouse ${url} ${LIGHTHOUSE_FLAGS}`, {
      stdio: 'pipe',
    });

    // Read the results
    const reportPath = path.join(reportsDir, 'report.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    // Extract scores and metrics
    const result: LighthouseResult = {
      url,
      scores: {
        performance: Math.round(reportData.categories.performance.score * 100),
        accessibility: Math.round(reportData.categories.accessibility.score * 100),
        bestPractices: Math.round(reportData.categories['best-practices'].score * 100),
        seo: Math.round(reportData.categories.seo.score * 100),
      },
      metrics: {
        fcp: Math.round(reportData.audits['first-contentful-paint'].numericValue),
        lcp: Math.round(reportData.audits['largest-contentful-paint'].numericValue),
        cls: parseFloat(reportData.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
        tbt: Math.round(reportData.audits['total-blocking-time'].numericValue),
        tti: Math.round(reportData.audits.interactive.numericValue),
      },
    };

    // Print results
    console.log(`✅ ${name} Results:`);
    console.log(`   Performance:     ${result.scores.performance}/100`);
    console.log(`   Accessibility:   ${result.scores.accessibility}/100`);
    console.log(`   Best Practices:  ${result.scores.bestPractices}/100`);
    console.log(`   SEO:             ${result.scores.seo}/100`);
    console.log(`\n   Core Web Vitals:`);
    console.log(`   FCP: ${result.metrics.fcp}ms`);
    console.log(`   LCP: ${result.metrics.lcp}ms ${result.metrics.lcp < 2500 ? '✅' : '❌'}`);
    console.log(`   CLS: ${result.metrics.cls} ${result.metrics.cls < 0.1 ? '✅' : '❌'}`);
    console.log(`   TBT: ${result.metrics.tbt}ms`);
    console.log(`   TTI: ${result.metrics.tti}ms`);

    return result;
  } catch (error) {
    console.error(`❌ Error running Lighthouse for ${name}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Audit\n');
  console.log('📋 Target Metrics:');
  console.log('   - LCP < 2500ms');
  console.log('   - FID < 100ms');
  console.log('   - CLS < 0.1');
  console.log('   - Performance Score: 90+');
  console.log('   - Accessibility Score: 95+');
  console.log('   - Best Practices Score: 90+');
  console.log('   - SEO Score: 95+');

  // Check if dev server is running
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'ignore' });
  } catch {
    console.error('\n❌ Dev server is not running!');
    console.error('Please start the dev server with: npm run dev');
    process.exit(1);
  }

  const results: LighthouseResult[] = [];

  // Run audits for each URL
  for (const { url, name } of URLS_TO_TEST) {
    const result = await runLighthouseAudit(url, name);
    if (result) {
      results.push(result);
    }
  }

  // Print summary
  console.log('\n\n📊 Performance Audit Summary\n');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    const { url, scores, metrics } = result;
    const name = URLS_TO_TEST[index].name;

    console.log(`\n${name}`);
    console.log(`URL: ${url}`);
    console.log(`Scores: P${scores.performance} | A${scores.accessibility} | BP${scores.bestPractices} | SEO${scores.seo}`);
    console.log(`Metrics: LCP ${metrics.lcp}ms | CLS ${metrics.cls} | TBT ${metrics.tbt}ms`);

    // Check if metrics meet targets
    const meetsTargets =
      scores.performance >= 90 &&
      scores.accessibility >= 95 &&
      scores.bestPractices >= 90 &&
      scores.seo >= 95 &&
      metrics.lcp < 2500 &&
      metrics.cls < 0.1;

    console.log(`Status: ${meetsTargets ? '✅ PASS' : '❌ NEEDS IMPROVEMENT'}`);
  });

  console.log('\n' + '='.repeat(80));

  // Save results to file
  const resultsPath = path.join(process.cwd(), 'lighthouse-reports', 'summary.json');
  fs.writeFileSync(
    resultsPath,
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );

  console.log(`\n💾 Detailed results saved to: lighthouse-reports/summary.json`);
  console.log('\n✅ Lighthouse audit complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
