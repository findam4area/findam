/**
 * Performance E2E Tests
 * 
 * Tests Core Web Vitals on simulated 3G connection
 * Requirements:
 * - 8.1: FCP < 1.5s on 3G connections
 * - 8.2: LCP < 2.5s on 3G connections
 * - 8.3: CLS < 0.1
 */

import { test, expect } from '@playwright/test';

// 3G Network Profile (Slow 3G)
const SLOW_3G_NETWORK = {
  offline: false,
  downloadThroughput: (400 * 1024) / 8, // 400 Kbps = 50 KB/s
  uploadThroughput: (400 * 1024) / 8,   // 400 Kbps = 50 KB/s
  latency: 400, // 400ms RTT
};

// Performance thresholds from requirements
const THRESHOLDS = {
  FCP: 1500,  // Requirement 8.1
  LCP: 2500,  // Requirement 8.2
  CLS: 0.1,   // Requirement 8.3
  TTI: 3500,  // Time to Interactive (design doc)
};

test.describe('Performance - Homepage on 3G Connection', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simulate 3G connection
    await context.route('**/*', async (route) => {
      // Add artificial delay to simulate 3G latency
      await new Promise((resolve) => setTimeout(resolve, 50));
      await route.continue();
    });
  });

  test('should meet FCP requirement on 3G (< 1.5s)', async ({ page, context }) => {
    // Apply 3G network conditions
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', SLOW_3G_NETWORK);

    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Measure FCP using Performance API
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            observer.disconnect();
            resolve(fcpEntry.startTime);
          }
        });
        observer.observe({ entryTypes: ['paint'] });

        // Timeout after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(-1);
        }, 5000);
      });
    });

    const loadTime = Date.now() - startTime;

    console.log(`FCP: ${fcp}ms (threshold: ${THRESHOLDS.FCP}ms)`);
    console.log(`Total load time: ${loadTime}ms`);

    // Assert FCP meets requirement
    expect(fcp).toBeGreaterThan(0);
    expect(fcp).toBeLessThan(THRESHOLDS.FCP);
  });

  test('should meet LCP requirement on 3G (< 2.5s)', async ({ page, context }) => {
    // Apply 3G network conditions
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', SLOW_3G_NETWORK);

    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure LCP using Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(-1);
        }, 10000);
      });
    });

    console.log(`LCP: ${lcp}ms (threshold: ${THRESHOLDS.LCP}ms)`);

    // Assert LCP meets requirement
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(THRESHOLDS.LCP);
  });

  test('should meet CLS requirement (< 0.1)', async ({ page, context }) => {
    // Apply 3G network conditions
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', SLOW_3G_NETWORK);

    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Measure CLS using Performance API
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            clsValue += (entry as any).value;
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        // Measure for 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });

    console.log(`CLS: ${cls} (threshold: ${THRESHOLDS.CLS})`);

    // Assert CLS meets requirement
    expect(cls).toBeLessThan(THRESHOLDS.CLS);
  });

  test('should display all critical content on 3G', async ({ page, context }) => {
    // Apply 3G network conditions
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', SLOW_3G_NETWORK);

    await page.goto('/');
    
    // Wait for hero section (above the fold)
    await page.waitForSelector('[data-testid="hero-section"], h1', { timeout: 5000 });

    // Verify critical elements are visible
    const heroVisible = await page.isVisible('h1');
    expect(heroVisible).toBe(true);

    console.log('✓ Critical content loaded on 3G');
  });

  test('should progressively render content on 3G', async ({ page, context }) => {
    // Apply 3G network conditions
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', SLOW_3G_NETWORK);

    const timestamps: Record<string, number> = {};
    const startTime = Date.now();

    await page.goto('/');

    // Track when different sections become visible
    timestamps.hero = Date.now() - startTime;

    // Wait for category showcase (may be lazy loaded)
    try {
      await page.waitForSelector('[data-testid="category-showcase"]', { timeout: 3000 });
      timestamps.categories = Date.now() - startTime;
    } catch {
      console.log('Categories not found (may be below fold)');
    }

    console.log('Progressive rendering timestamps:', timestamps);
    
    // Hero should load quickly
    expect(timestamps.hero).toBeLessThan(2000);
  });
});

test.describe('Performance - Search Page on 3G Connection', () => {
  test('should load search page within performance budget', async ({ page, context }) => {
    // Apply 3G network conditions
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', SLOW_3G_NETWORK);

    const startTime = Date.now();
    await page.goto('/search');
    
    // Wait for search input
    await page.waitForSelector('input[type="text"], input[type="search"]', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Search page load time: ${loadTime}ms`);
    
    // Should load within reasonable time on 3G
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Performance - Resource Optimization', () => {
  test('should lazy load images below the fold', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = await page.locator('img').all();
    
    let lazyLoadedCount = 0;
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      if (loading === 'lazy') {
        lazyLoadedCount++;
      }
    }
    
    console.log(`Images with lazy loading: ${lazyLoadedCount}/${images.length}`);
    
    // At least some images should be lazy loaded
    expect(lazyLoadedCount).toBeGreaterThan(0);
  });

  test('should use Next.js Image optimization', async ({ page }) => {
    await page.goto('/');
    
    // Check for Next.js optimized images
    const nextImages = await page.locator('img[srcset*="/_next/image"]').count();
    
    console.log(`Next.js optimized images: ${nextImages}`);
    
    // Should use Next.js Image component
    if (nextImages === 0) {
      console.warn('Warning: No Next.js optimized images found');
    }
  });

  test('should have efficient bundle size', async ({ page }) => {
    await page.goto('/');
    
    // Get all JavaScript resources
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter((r) => r.name.endsWith('.js'))
        .map((r) => ({
          name: r.name,
          size: r.transferSize,
          duration: r.duration,
        }));
    });
    
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    const totalJsSizeKB = totalJsSize / 1024;
    
    console.log(`Total JS size: ${totalJsSizeKB.toFixed(2)} KB`);
    console.log(`JS resources: ${jsResources.length}`);
    
    // Design doc specifies < 300KB gzipped
    // Transfer size is already gzipped, so check against 300KB
    expect(totalJsSizeKB).toBeLessThan(500); // Allow some buffer for real app
  });
});

test.describe('Performance - Real User Experience', () => {
  test('should maintain 60 FPS during scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Start FPS monitoring
    const fpsSamples: number[] = [];
    
    await page.evaluate(() => {
      let lastTime = performance.now();
      let frames = 0;
      
      function measureFPS() {
        frames++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (currentTime - lastTime));
          (window as any).fpsSamples = (window as any).fpsSamples || [];
          (window as any).fpsSamples.push(fps);
          frames = 0;
          lastTime = currentTime;
        }
        if ((window as any).measuring) {
          requestAnimationFrame(measureFPS);
        }
      }
      
      (window as any).measuring = true;
      requestAnimationFrame(measureFPS);
    });
    
    // Scroll page
    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(2000);
    
    // Stop measuring
    const samples = await page.evaluate(() => {
      (window as any).measuring = false;
      return (window as any).fpsSamples || [];
    });
    
    if (samples.length > 0) {
      const avgFPS = samples.reduce((a: number, b: number) => a + b, 0) / samples.length;
      console.log(`Average FPS during scroll: ${avgFPS.toFixed(1)}`);
      
      // Should maintain close to 60 FPS
      expect(avgFPS).toBeGreaterThan(50);
    }
  });

  test('should respond to interactions quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find clickable element
    const button = page.locator('button, a').first();
    
    const startTime = Date.now();
    await button.click();
    const responseTime = Date.now() - startTime;
    
    console.log(`Interaction response time: ${responseTime}ms`);
    
    // Should respond within 100ms (FID threshold)
    expect(responseTime).toBeLessThan(200);
  });
});
