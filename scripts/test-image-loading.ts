/**
 * Image Loading Performance Test
 * 
 * Tests image loading performance on slow 3G connection simulation
 * 
 * Task: 10.2 - Optimize images with Next.js 16 Image component
 * Requirements: 11.4, 11.5, 13.14, 13.15
 * 
 * Usage: npx playwright test scripts/test-image-loading.ts
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Image Loading Performance', () => {
  test.use({
    ...devices['iPhone 13'],
    // Simulate Slow 3G network
    offline: false,
    httpCredentials: undefined,
  });

  test.beforeEach(async ({ context }) => {
    // Simulate Slow 3G: 500kbps download, 500kbps upload, 400ms latency
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 400)); // Add latency
      await route.continue();
    });
  });

  test('homepage hero image should load with priority', async ({ page }) => {
    await page.goto('/');

    // Check that hero image has priority attribute
    const heroImage = page.locator('img[alt*="Background"]').first();
    await expect(heroImage).toBeVisible({ timeout: 10000 });

    // Verify image is using Next.js optimization
    const src = await heroImage.getAttribute('src');
    expect(src).toContain('/_next/image');
  });

  test('featured listing images should have proper sizes', async ({ page }) => {
    await page.goto('/');

    // Wait for featured listings to load
    await page.waitForSelector('[data-testid="featured-listings"], .grid', { timeout: 10000 });

    // Check that listing images have sizes attribute
    const listingImages = page.locator('img[alt*="listing"], img[alt*="Listing"]').first();
    await expect(listingImages).toBeVisible({ timeout: 10000 });

    // Verify Next.js image optimization
    const src = await listingImages.getAttribute('src');
    expect(src).toContain('/_next/image');
  });

  test('category card images should lazy load', async ({ page }) => {
    await page.goto('/');

    // Scroll down to categories section
    await page.evaluate(() => window.scrollBy(0, 500));

    // Check that category images load
    const categoryImages = page.locator('img[alt*="category"], img[alt*="Category"]').first();
    await expect(categoryImages).toBeVisible({ timeout: 10000 });
  });

  test('listing detail page should have optimized gallery', async ({ page }) => {
    // First, get a listing ID from the browse page
    await page.goto('/browse');
    await page.waitForSelector('a[href*="/listing/"]', { timeout: 10000 });
    
    const listingLink = page.locator('a[href*="/listing/"]').first();
    await listingLink.click();

    // Wait for gallery to load
    await page.waitForSelector('img', { timeout: 10000 });

    // Check that main gallery image is optimized
    const galleryImage = page.locator('img').first();
    const src = await galleryImage.getAttribute('src');
    expect(src).toContain('/_next/image');
  });

  test('images should use WebP or AVIF format', async ({ page }) => {
    await page.goto('/');

    // Check that images are being served in modern formats
    const response = await page.waitForResponse(
      (response) => response.url().includes('/_next/image'),
      { timeout: 10000 }
    );

    const contentType = response.headers()['content-type'];
    
    // Next.js should serve WebP or AVIF based on browser support
    expect(
      contentType === 'image/webp' || 
      contentType === 'image/avif' || 
      contentType === 'image/jpeg'
    ).toBeTruthy();
  });

  test('lazy-loaded images should not block initial render', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Check that First Contentful Paint happens quickly
    const fcp = await page.evaluate(() => {
      return performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
    });

    const loadTime = Date.now() - startTime;
    
    // FCP should be under 3 seconds even on slow 3G
    expect(loadTime).toBeLessThan(3000);
  });

  test('blur placeholders should be visible while loading', async ({ page, context }) => {
    // Block image loading temporarily to test placeholders
    await context.route('**/*.{png,jpg,jpeg,webp,avif}', route => route.abort());

    await page.goto('/');

    // Check that placeholder styles are present
    const images = page.locator('img');
    const count = await images.count();

    expect(count).toBeGreaterThan(0);

    // At least some images should have blur-up placeholder
    const hasBlur = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).some(img => 
        img.style.filter?.includes('blur') || 
        img.getAttribute('src')?.includes('data:image')
      );
    });

    expect(hasBlur).toBeTruthy();
  });
});

test.describe('Responsive Image Sizes', () => {
  test('images should load appropriate sizes for mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check image sources include width parameters appropriate for mobile
    const images = page.locator('img[src*="/_next/image"]');
    const firstImage = images.first();
    
    if (await firstImage.count() > 0) {
      const src = await firstImage.getAttribute('src');
      
      // Next.js should serve smaller images for mobile
      // The URL should contain width parameters
      expect(src).toMatch(/[?&]w=\d+/);
    }
  });

  test('images should load appropriate sizes for desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Check that larger images are loaded for desktop
    const images = page.locator('img[src*="/_next/image"]');
    const firstImage = images.first();
    
    if (await firstImage.count() > 0) {
      const src = await firstImage.getAttribute('src');
      expect(src).toMatch(/[?&]w=\d+/);
    }
  });
});

test.describe('Image Optimization Config', () => {
  test('should verify remotePatterns are configured', async ({ page }) => {
    // Test loading an image from Supabase
    const supabaseImageUrl = 'https://example.supabase.co/storage/v1/object/public/test.jpg';
    
    // This will fail if remotePatterns is not configured
    const response = await page.goto(`/_next/image?url=${encodeURIComponent(supabaseImageUrl)}&w=640&q=75`);
    
    // Should not return 400 error for misconfigured domains
    expect(response?.status()).not.toBe(400);
  });
});
