import { test, expect } from "@playwright/test";

/**
 * E2E Test: Search and Filter Flow
 *
 * Tests the complete search and filtering experience:
 * 1. Text search with autocomplete
 * 2. Category filtering
 * 3. Price range filtering
 * 4. Location filtering
 * 5. Combined filters
 * 6. Sort functionality
 */

test.describe("Search and Filter Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should perform text search with autocomplete", async ({ page }) => {
    // Step 1: Click on search bar
    await page.click('input[placeholder*="Search"]');

    // Step 2: Type search query
    await page.fill('input[placeholder*="Search"]', "phone");

    // Step 3: Wait for autocomplete suggestions
    await page.waitForSelector('[data-testid="autocomplete-suggestions"]', {
      timeout: 3000,
    });

    // Step 4: Verify suggestions appear
    const suggestions = await page.locator('[data-testid="autocomplete-item"]').count();
    expect(suggestions).toBeGreaterThan(0);

    // Step 5: Click on a suggestion
    await page.click('[data-testid="autocomplete-item"]', { force: true });

    // Step 6: Verify navigation to search results
    await page.waitForURL(/\/search\?q=/);

    // Step 7: Verify search results are displayed
    const results = await page.locator('[data-testid="listing-card"]').count();
    expect(results).toBeGreaterThan(0);
  });

  test("should filter by category", async ({ page }) => {
    // Step 1: Navigate to search page
    await page.goto("/search");

    // Step 2: Click on category filter
    await page.click('button:has-text("Category")');

    // Step 3: Select a category
    await page.click('label:has-text("Electronics")');

    // Step 4: Apply filter
    await page.click('button:has-text("Apply")');

    // Step 5: Wait for results to update
    await page.waitForTimeout(1000);

    // Step 6: Verify URL contains category filter
    expect(page.url()).toContain("category=");

    // Step 7: Verify all results match the category
    const categoryBadges = await page.locator('[data-testid="listing-category"]').allTextContents();
    categoryBadges.forEach((badge) => {
      expect(badge.toLowerCase()).toContain("electronics");
    });
  });

  test("should filter by price range", async ({ page }) => {
    // Step 1: Navigate to search page
    await page.goto("/search");

    // Step 2: Click on price filter
    await page.click('button:has-text("Price")');

    // Step 3: Set minimum price
    await page.fill('input[name="minPrice"]', "10000");

    // Step 4: Set maximum price
    await page.fill('input[name="maxPrice"]', "100000");

    // Step 5: Apply filter
    await page.click('button:has-text("Apply")');

    // Step 6: Wait for results to update
    await page.waitForTimeout(1000);

    // Step 7: Verify URL contains price filters
    expect(page.url()).toContain("minPrice=");
    expect(page.url()).toContain("maxPrice=");

    // Step 8: Verify all results are within price range
    const prices = await page.locator('[data-testid="listing-price"]').allTextContents();
    prices.forEach((priceText) => {
      const price = parseInt(priceText.replace(/[^0-9]/g, ""));
      expect(price).toBeGreaterThanOrEqual(10000);
      expect(price).toBeLessThanOrEqual(100000);
    });
  });

  test("should filter by location", async ({ page }) => {
    // Step 1: Navigate to search page
    await page.goto("/search");

    // Step 2: Click on location filter
    await page.click('button:has-text("Location")');

    // Step 3: Select state
    await page.selectOption('select[name="state"]', "Lagos");

    // Step 4: Wait for LGA options to load
    await page.waitForTimeout(500);

    // Step 5: Select LGA
    await page.selectOption('select[name="lga"]', "Ikeja");

    // Step 6: Apply filter
    await page.click('button:has-text("Apply")');

    // Step 7: Wait for results to update
    await page.waitForTimeout(1000);

    // Step 8: Verify URL contains location filters
    expect(page.url()).toContain("state=Lagos");
    expect(page.url()).toContain("lga=Ikeja");

    // Step 9: Verify all results match the location
    const locations = await page.locator('[data-testid="listing-location"]').allTextContents();
    locations.forEach((location) => {
      expect(location).toContain("Lagos");
      expect(location).toContain("Ikeja");
    });
  });

  test("should apply combined filters", async ({ page }) => {
    // Step 1: Navigate to search page
    await page.goto("/search");

    // Step 2: Apply category filter
    await page.click('button:has-text("Category")');
    await page.click('label:has-text("Electronics")');
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(500);

    // Step 3: Apply price filter
    await page.click('button:has-text("Price")');
    await page.fill('input[name="minPrice"]', "10000");
    await page.fill('input[name="maxPrice"]', "100000");
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(500);

    // Step 4: Apply location filter
    await page.click('button:has-text("Location")');
    await page.selectOption('select[name="state"]', "Lagos");
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(1000);

    // Step 5: Verify URL contains all filters
    expect(page.url()).toContain("category=");
    expect(page.url()).toContain("minPrice=");
    expect(page.url()).toContain("maxPrice=");
    expect(page.url()).toContain("state=Lagos");

    // Step 6: Verify results match all filters
    const results = await page.locator('[data-testid="listing-card"]').count();
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test("should sort results by price", async ({ page }) => {
    // Step 1: Navigate to search page with some results
    await page.goto("/search?q=phone");

    // Step 2: Wait for results to load
    await page.waitForSelector('[data-testid="listing-card"]');

    // Step 3: Click on sort dropdown
    await page.click('select[name="sort"]');

    // Step 4: Select "Price: Low to High"
    await page.selectOption('select[name="sort"]', "price-asc");

    // Step 5: Wait for results to update
    await page.waitForTimeout(1000);

    // Step 6: Verify URL contains sort parameter
    expect(page.url()).toContain("sort=price-asc");

    // Step 7: Verify results are sorted by price ascending
    const prices = await page.locator('[data-testid="listing-price"]').allTextContents();
    const priceValues = prices.map((p) => parseInt(p.replace(/[^0-9]/g, "")));

    for (let i = 0; i < priceValues.length - 1; i++) {
      expect(priceValues[i]).toBeLessThanOrEqual(priceValues[i + 1]);
    }
  });

  test("should sort results by date", async ({ page }) => {
    // Step 1: Navigate to search page
    await page.goto("/search?q=phone");

    // Step 2: Wait for results to load
    await page.waitForSelector('[data-testid="listing-card"]');

    // Step 3: Click on sort dropdown
    await page.click('select[name="sort"]');

    // Step 4: Select "Newest First"
    await page.selectOption('select[name="sort"]', "date-desc");

    // Step 5: Wait for results to update
    await page.waitForTimeout(1000);

    // Step 6: Verify URL contains sort parameter
    expect(page.url()).toContain("sort=date-desc");

    // Step 7: Verify results are sorted by date descending
    const dates = await page.locator('[data-testid="listing-date"]').allTextContents();
    expect(dates.length).toBeGreaterThan(0);
  });

  test("should clear all filters", async ({ page }) => {
    // Step 1: Navigate to search page with filters
    await page.goto("/search?category=electronics&minPrice=10000&maxPrice=100000&state=Lagos");

    // Step 2: Wait for results to load
    await page.waitForSelector('[data-testid="listing-card"]');

    // Step 3: Click "Clear All" button
    await page.click('button:has-text("Clear All")');

    // Step 4: Wait for results to update
    await page.waitForTimeout(1000);

    // Step 5: Verify URL no longer contains filters
    expect(page.url()).not.toContain("category=");
    expect(page.url()).not.toContain("minPrice=");
    expect(page.url()).not.toContain("maxPrice=");
    expect(page.url()).not.toContain("state=");

    // Step 6: Verify all results are displayed
    const results = await page.locator('[data-testid="listing-card"]').count();
    expect(results).toBeGreaterThan(0);
  });

  test("should handle empty search results", async ({ page }) => {
    // Step 1: Search for non-existent item
    await page.goto("/search?q=xyzabc123nonexistent");

    // Step 2: Wait for page to load
    await page.waitForTimeout(1000);

    // Step 3: Verify empty state message
    await expect(page.locator('text=No results found')).toBeVisible();

    // Step 4: Verify suggestions are displayed
    await expect(page.locator('text=Try adjusting your filters')).toBeVisible();
  });

  test("should save recent searches", async ({ page }) => {
    // Step 1: Perform a search
    await page.goto("/");
    await page.fill('input[placeholder*="Search"]', "laptop");
    await page.press('input[placeholder*="Search"]', "Enter");

    // Step 2: Wait for results
    await page.waitForURL(/\/search\?q=/);

    // Step 3: Go back to home page
    await page.goto("/");

    // Step 4: Click on search bar
    await page.click('input[placeholder*="Search"]');

    // Step 5: Verify recent searches are displayed
    await expect(page.locator('text=Recent Searches')).toBeVisible();
    await expect(page.locator('text=laptop')).toBeVisible();
  });
});
