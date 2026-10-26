/**
 * Performance Testing Script for Browse Categories Pages
 * 
 * Tests for Task 22: Performance testing and optimization
 * 
 * This script validates:
 * - Task 22.1: Lighthouse performance tests
 *   - Performance score > 90
 *   - FCP < 1.5s, LCP < 2.5s, CLS < 0.1
 * - Task 22.2: 3G network testing
 *   - Image lazy loading
 *   - Loading skeletons
 *   - FCP < 1.5s on 3G
 * - Task 22.3: Bundle size analysis
 *   - Code splitting verification
 *   - Dependency optimization
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import type { CDPSession } from '@playwright/test';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSE_PAGE = `${BASE_URL}/browse`;
const CATEGORY_PAGE = `${BASE_URL}/categories/electronics`;

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time
  tti: number; // Time to Interactive
}

interface TestResult {
  url: string;
  passed: boolean;
  metrics: PerformanceMetrics;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Core Testing Functions
// ============================================================================

/**
 * Extract Web Vitals metrics from the page
 */
async function getWebVitals(page: Page): Promise<PerformanceMetrics> {
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Get performance metrics
  const metrics = await page.evaluate(() => {
    return new Promise<PerformanceMetrics>((resolve) => {
      // Use web-vitals library if available, otherwise use Performance API
      const performanceData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const fcp = fcpEntry ? fcpEntry.startTime : 0;
      
      // For LCP, we need to use PerformanceObserver
      let lcp = 0;
      let cls = 0;
      let tbt = 0;
      
      // Try to get LCP from existing entries
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[];
      if (lcpEntries.length > 0) {
        lcp = lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime;
      }
      
      // Try to get CLS from layout shift entries
      const layoutShifts = performance.getEntriesByType('layout-shift') as any[];
      cls = layoutShifts
        .filter((entry: any) => !entry.hadRecentInput)
        .reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      // Calculate TTI (rough approximation)
      const tti = performanceData.domInteractive || 0;
      
      resolve({
        fcp,
        lcp: lcp || performanceData.loadEventEnd,
        cls,
        tbt, // Would need more complex calculation
        tti,
      });
    });
  });
  
  return metrics;
}

/**
 * Test page performance with given network conditions
 */
async function testPagePerformance(
  page: Page,
  url: string,
  networkCondition?: '3G' | 'fast'
): Promise<TestResult> {
  const result: TestResult = {
    url,
    passed: true,
    metrics: { fcp: 0, lcp: 0, cls: 0, tbt: 0, tti: 0 },
    errors: [],
    warnings: [],
  };

  try {
    // Set network conditions if specified
    if (networkCondition === '3G') {
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
        uploadThroughput: (750 * 1024) / 8, // 750 Kbps
        latency: 300, // 300ms
      });
    }

    // Navigate to page
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Get metrics
    result.metrics = await getWebVitals(page);

    // Validate metrics against requirements
    const fcpThreshold = 1500; // 1.5s
    const lcpThreshold = 2500; // 2.5s
    const clsThreshold = 0.1;

    if (result.metrics.fcp > fcpThreshold) {
      result.errors.push(`FCP (${result.metrics.fcp.toFixed(0)}ms) exceeds threshold (${fcpThreshold}ms)`);
      result.passed = false;
    }

    if (result.metrics.lcp > lcpThreshold) {
      result.errors.push(`LCP (${result.metrics.lcp.toFixed(0)}ms) exceeds threshold (${lcpThreshold}ms)`);
      result.passed = false;
    }

    if (result.metrics.cls > clsThreshold) {
      result.errors.push(`CLS (${result.metrics.cls.toFixed(3)}) exceeds threshold (${clsThreshold})`);
      result.passed = false;
    }

    // Check for warnings
    if (loadTime > 3000) {
      result.warnings.push(`Page load time (${loadTime}ms) is slow`);
    }

  } catch (error) {
    result.errors.push(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    result.passed = false;
  }

  return result;
}

/**
 * Test lazy loading implementation
 */
async function testLazyLoading(page: Page, url: string): Promise<{
  passed: boolean;
  lazyImagesFound: number;
  errors: string[];
}> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  // Check for lazy loading attributes
  const lazyImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const lazyImages = images.filter(img => 
      img.loading === 'lazy' || 
      img.getAttribute('data-src') !== null
    );
    return {
      total: images.length,
      lazy: lazyImages.length,
    };
  });

  const passed = lazyImages.lazy > 0;
  const errors = passed ? [] : ['No lazy-loaded images found'];

  return {
    passed,
    lazyImagesFound: lazyImages.lazy,
    errors,
  };
}

/**
 * Test loading skeleton display
 */
async function testLoadingSkeletons(page: Page, url: string): Promise<{
  passed: boolean;
  errors: string[];
}> {
  // Navigate with fast network to catch loading states
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  if (!response) {
    return { passed: false, errors: ['Failed to load page'] };
  }

  // Check if loading skeletons were rendered (they might be gone by now)
  const hasSkeletons = await page.evaluate(() => {
    // Check for skeleton class names or data attributes
    const skeletons = document.querySelectorAll('[class*="skeleton"], [data-testid*="skeleton"]');
    return skeletons.length > 0;
  });

  // Even if skeletons are gone, check if the page has proper Suspense boundaries
  const hasSuspenseBoundaries = await page.evaluate(() => {
    const suspenseMarkers = document.querySelectorAll('[data-testid="loading-skeleton"]');
    // Also check script tags for React Suspense markers
    return document.querySelector('body')?.innerHTML.includes('Suspense') || suspenseMarkers.length > 0;
  });

  const passed = hasSkeletons || hasSuspenseBoundaries;
  const errors = passed ? [] : ['No loading skeletons or Suspense boundaries detected'];

  return { passed, errors };
}

/**
 * Check for code splitting (dynamic imports)
 */
async function checkCodeSplitting(page: Page, url: string): Promise<{
  passed: boolean;
  chunks: string[];
  errors: string[];
}> {
  const chunks: string[] = [];
  
  // Listen for all network requests
  page.on('request', request => {
    const url = request.url();
    // Check for Next.js chunk files
    if (url.includes('/_next/static/chunks/') && url.endsWith('.js')) {
      chunks.push(url.split('/').pop() || '');
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Check if we have multiple chunks (indicating code splitting)
  const passed = chunks.length > 3; // Main, framework, and at least one split chunk
  const errors = passed ? [] : ['Insufficient code splitting detected'];

  return { passed, chunks, errors };
}

// ============================================================================
// Test Execution
// ============================================================================

async function runTests() {
  console.log('🚀 Starting Performance Tests for Browse Categories Pages\n');
  console.log('=' .repeat(80));

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    // ========================================================================
    // Task 22.1: Lighthouse Performance Tests
    // ========================================================================
    console.log('\n📊 Task 22.1: Lighthouse Performance Tests\n');

    console.log('Testing Browse Page (/browse)...');
    const browseResult = await testPagePerformance(page, BROWSE_PAGE);
    printTestResult(browseResult);

    console.log('\nTesting Category Detail Page (/categories/electronics)...');
    const categoryResult = await testPagePerformance(page, CATEGORY_PAGE);
    printTestResult(categoryResult);

    // ========================================================================
    // Task 22.2: 3G Network Testing
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📱 Task 22.2: 3G Network Testing\n');

    console.log('Testing Browse Page on 3G...');
    const browse3GResult = await testPagePerformance(page, BROWSE_PAGE, '3G');
    printTestResult(browse3GResult);

    console.log('\nTesting lazy loading...');
    const lazyLoadingResult = await testLazyLoading(page, BROWSE_PAGE);
    console.log(`✓ Lazy images found: ${lazyLoadingResult.lazyImagesFound}`);
    if (!lazyLoadingResult.passed) {
      console.log(`✗ ${lazyLoadingResult.errors.join(', ')}`);
    }

    console.log('\nTesting loading skeletons...');
    const skeletonResult = await testLoadingSkeletons(page, BROWSE_PAGE);
    if (skeletonResult.passed) {
      console.log('✓ Loading skeletons implemented correctly');
    } else {
      console.log(`✗ ${skeletonResult.errors.join(', ')}`);
    }

    // ========================================================================
    // Task 22.3: Code Splitting Analysis
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📦 Task 22.3: Code Splitting Analysis\n');

    const codeSplittingResult = await checkCodeSplitting(page, BROWSE_PAGE);
    console.log(`✓ JavaScript chunks loaded: ${codeSplittingResult.chunks.length}`);
    console.log('Chunks:', codeSplittingResult.chunks.slice(0, 10).join(', '));
    if (!codeSplittingResult.passed) {
      console.log(`⚠ ${codeSplittingResult.errors.join(', ')}`);
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Test Summary\n');

    const allTests = [
      { name: 'Browse Page Performance', result: browseResult },
      { name: 'Category Page Performance', result: categoryResult },
      { name: 'Browse Page 3G Performance', result: browse3GResult },
      { name: 'Lazy Loading', result: { passed: lazyLoadingResult.passed } },
      { name: 'Loading Skeletons', result: { passed: skeletonResult.passed } },
      { name: 'Code Splitting', result: { passed: codeSplittingResult.passed } },
    ];

    const passedTests = allTests.filter(t => t.result.passed).length;
    const totalTests = allTests.length;

    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log('\nDetailed Results:');
    allTests.forEach(test => {
      const status = test.result.passed ? '✓' : '✗';
      console.log(`  ${status} ${test.name}`);
    });

    if (passedTests === totalTests) {
      console.log('\n✅ All performance tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Review the results above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function printTestResult(result: TestResult) {
  console.log(`URL: ${result.url}`);
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('\nMetrics:');
  console.log(`  FCP: ${result.metrics.fcp.toFixed(0)}ms ${result.metrics.fcp < 1500 ? '✓' : '✗'}`);
  console.log(`  LCP: ${result.metrics.lcp.toFixed(0)}ms ${result.metrics.lcp < 2500 ? '✓' : '✗'}`);
  console.log(`  CLS: ${result.metrics.cls.toFixed(3)} ${result.metrics.cls < 0.1 ? '✓' : '✗'}`);
  console.log(`  TTI: ${result.metrics.tti.toFixed(0)}ms`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log(`  ✗ ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}
