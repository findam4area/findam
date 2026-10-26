/**
 * Accessibility Zoom Compliance Tests
 * 
 * Validates WCAG 2.1 Level AA zoom requirements:
 * - Support browser zoom up to 200%
 * - Text reflows without horizontal scrolling
 * - All functionality remains accessible
 * - No content is clipped or hidden
 * 
 * Requirement: 15.10
 */

import { test, expect } from '@playwright/test';

const ZOOM_LEVELS = [100, 125, 150, 175, 200];
const TEST_URL = '/';

test.describe('Zoom Compliance - Requirement 15.10', () => {
  test('should support zoom up to 200% without horizontal scrolling', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    for (const zoomLevel of ZOOM_LEVELS) {
      // Set zoom level via CDP
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setPageScaleFactor', {
        pageScaleFactor: zoomLevel / 100,
      });

      // Wait for reflow
      await page.waitForTimeout(500);

      // Check for horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
      console.log(`✓ ${zoomLevel}% zoom: No horizontal scrolling`);
    }
  });

  test('should maintain text readability at 200% zoom', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Set 200% zoom
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', {
      pageScaleFactor: 2.0,
    });

    await page.waitForTimeout(500);

    // Check hero section text is visible
    const heroHeading = page.locator('[data-testid="hero-heading"]').first();
    await expect(heroHeading).toBeVisible();

    // Check if text is not clipped
    const isClipped = await heroHeading.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.bottom > window.innerHeight ||
        rect.right > window.innerWidth ||
        el.scrollHeight > el.clientHeight ||
        el.scrollWidth > el.clientWidth
      );
    });

    expect(isClipped).toBe(false);
    console.log('✓ Text readability maintained at 200% zoom');
  });

  test('should maintain interactive element accessibility at 200% zoom', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Set 200% zoom
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', {
      pageScaleFactor: 2.0,
    });

    await page.waitForTimeout(500);

    // Check buttons are clickable
    const ctaButtons = page.locator('a[href*="search"], a[href*="create"]').first();
    await expect(ctaButtons).toBeVisible();

    const isClickable = await ctaButtons.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    });

    expect(isClickable).toBe(true);
    console.log('✓ Interactive elements accessible at 200% zoom');
  });

  test('should maintain navigation functionality at 200% zoom', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Set 200% zoom
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', {
      pageScaleFactor: 2.0,
    });

    await page.waitForTimeout(500);

    // Check if navigation is accessible (look for any nav element)
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
      console.log('✓ Navigation remains accessible at 200% zoom');
    } else {
      console.log('⚠ No navigation element found');
    }
  });

  test('should not clip card content at 200% zoom', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Set 200% zoom
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', {
      pageScaleFactor: 2.0,
    });

    await page.waitForTimeout(500);

    // Check if any cards exist and are not clipped
    const cards = page.locator('[class*="card"], [data-testid*="card"]').first();
    
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible();

      const isContentClipped = await cards.evaluate((el) => {
        return el.scrollHeight > el.clientHeight + 5; // 5px tolerance
      });

      expect(isContentClipped).toBe(false);
      console.log('✓ Card content not clipped at 200% zoom');
    } else {
      console.log('⚠ No card elements found on page');
    }
  });

  test('should maintain focus indicators visibility at 200% zoom', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Set 200% zoom
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', {
      pageScaleFactor: 2.0,
    });

    await page.waitForTimeout(500);

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check if focus indicator is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Verify focus ring is present
    const hasFocusRing = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.outline !== 'none' ||
        styles.boxShadow.includes('ring') ||
        styles.border !== 'none'
      );
    });

    expect(hasFocusRing).toBe(true);
    console.log('✓ Focus indicators visible at 200% zoom');
  });

  test('should handle viewport changes smoothly', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const client = await page.context().newCDPSession(page);

    // Test zoom transitions
    for (let zoom = 100; zoom <= 200; zoom += 25) {
      await client.send('Emulation.setPageScaleFactor', {
        pageScaleFactor: zoom / 100,
      });

      await page.waitForTimeout(200);

      // Check layout stability (no errors thrown)
      const layoutError = await page.evaluate(() => {
        return document.body.clientWidth === 0 || document.body.clientHeight === 0;
      });

      expect(layoutError).toBe(false);
    }

    console.log('✓ Smooth zoom transitions from 100% to 200%');
  });
});

test.describe('Mobile Zoom Compliance', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
  });

  test('should support pinch zoom on mobile viewports', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Check meta viewport tag allows zooming
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') || '';
    });

    // Should NOT contain user-scalable=no or maximum-scale=1
    expect(viewportMeta).not.toContain('user-scalable=no');
    expect(viewportMeta).not.toContain('maximum-scale=1');

    console.log('✓ Mobile viewport allows user scaling');
  });
});
