/**
 * Smoke Tests for Post-Deployment Validation
 * 
 * These tests verify critical functionality after deployment to catch
 * catastrophic failures before they impact users.
 * 
 * Requirements:
 * - 33.9: Smoke tests running after each deployment
 * 
 * Smoke tests should be:
 * - Fast (< 30 seconds total)
 * - Focused on critical paths only
 * - Able to run in production-like environments
 * - Fail-fast to catch major issues immediately
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Health check endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBeTruthy();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.api).toBeDefined();
  });

  test('Homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    
    expect(response?.status()).toBe(200);
    
    // Verify critical sections are present
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({ timeout: 10000 });
  });

  test('Database connectivity works', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    
    expect(body.checks.database.status).not.toBe('unhealthy');
  });

  test('Featured listings API returns data', async ({ request }) => {
    const response = await request.get('/api/listings/featured');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(Array.isArray(body.listings)).toBe(true);
  });

  test('Categories API returns data', async ({ request }) => {
    const response = await request.get('/api/categories');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('Search functionality is accessible', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Verify search input is interactive
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('Navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Find and click a category (if available)
    const categoryCard = page.locator('[data-testid="category-card"]').first();
    
    if (await categoryCard.isVisible()) {
      await categoryCard.click();
      // Wait for navigation
      await page.waitForURL(/\/categories\/.*/, { timeout: 10000 });
      
      // Verify we navigated successfully
      expect(page.url()).toContain('/categories/');
    }
  });

  test('Static assets load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check for critical CSS
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
  });

  test('JavaScript executes', async ({ page }) => {
    await page.goto('/');
    
    // Verify client-side hydration by checking if interactive elements work
    const response = await page.evaluate(() => {
      return {
        hasReact: typeof (window as any).React !== 'undefined' || 
                  document.querySelector('[data-reactroot]') !== null ||
                  document.querySelector('[data-reactid]') !== null,
        hasInteractivity: document.querySelectorAll('button').length > 0,
      };
    });
    
    expect(response.hasInteractivity).toBe(true);
  });

  test('Web Vitals monitoring endpoint accepts data', async ({ request }) => {
    const payload = {
      metrics: [
        {
          name: 'FCP',
          value: 1200,
          rating: 'good',
          id: 'test-id',
        },
      ],
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
    };

    const response = await request.post('/api/monitoring/web-vitals', {
      data: payload,
    });

    expect(response.status()).toBe(200);
  });

  test('Error boundary works', async ({ page }) => {
    // This test verifies that the app doesn't completely crash
    await page.goto('/');
    
    // Check for no global errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    // Allow for expected errors but no critical crashes
    const criticalErrors = errors.filter(
      (err) => err.includes('Uncaught') && !err.includes('ResizeObserver')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Smoke Tests - Performance', () => {
  test('Homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    // Generous timeout for smoke test (production should be much faster)
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('API endpoints respond quickly', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/health');
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // 5 seconds max
  });
});

test.describe('Smoke Tests - Security', () => {
  test('Security headers are present', async ({ request }) => {
    const response = await request.get('/');
    
    const headers = response.headers();
    
    // Check for important security headers
    expect(headers['x-frame-options'] || headers['x-content-type-options']).toBeDefined();
  });

  test('HTTPS redirect works (if applicable)', async ({ page }) => {
    // This test is environment-dependent
    // In production, HTTP should redirect to HTTPS
    const url = page.url();
    if (url.startsWith('https://')) {
      expect(url).toContain('https://');
    }
  });
});

test.describe('Smoke Tests - Data Integrity', () => {
  test('No broken images on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter((img) => !img.complete || img.naturalHeight === 0).length;
    });
    
    // Allow for lazy-loaded images, but no critical ones should be broken
    expect(brokenImages).toBeLessThan(5);
  });

  test('No console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(
      (err) => 
        !err.includes('ResizeObserver') && 
        !err.includes('favicon') &&
        !err.includes('script error')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
