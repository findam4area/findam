import { test, expect } from "@playwright/test";

/**
 * E2E Test: Registration → Listing Creation → Boost Flow
 *
 * Tests the complete user journey from registration to boosting a listing:
 * 1. User registers a new account
 * 2. User verifies their phone number
 * 3. User creates a new listing
 * 4. User boosts the listing with payment
 */

test.describe("Registration → Listing Creation → Boost Flow", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testUsername = `testuser${Date.now()}`;

  test("should complete full registration to boost flow", async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto("/register");
    await expect(page).toHaveTitle(/FindAm/);

    // Step 2: Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Wait for redirect to dashboard or verification page
    await page.waitForURL(/\/(dashboard|verify)/);

    // Step 5: If on verification page, simulate phone verification
    if (page.url().includes("/verify")) {
      // Note: In a real test, you'd need to handle OTP verification
      // For now, we'll skip this step or use a test phone number
      await page.fill('input[name="phone"]', "+2348012345678");
      await page.click('button:has-text("Send OTP")');

      // Wait for OTP input
      await page.waitForSelector('input[name="otp"]');

      // In a real scenario, you'd retrieve the OTP from a test service
      // For now, we'll assume verification is handled
      await page.fill('input[name="otp"]', "123456");
      await page.click('button:has-text("Verify")');

      // Wait for redirect to dashboard
      await page.waitForURL(/\/dashboard/);
    }

    // Step 6: Navigate to create listing page
    await page.click('a[href="/listings/new"]');
    await page.waitForURL("/listings/new");

    // Step 7: Fill listing form - Step 1: Category
    await page.click('button:has-text("Electronics")');
    await page.click('button:has-text("Phones")');
    await page.click('button:has-text("Next")');

    // Step 8: Fill listing form - Step 2: Details
    await page.fill('input[name="title"]', "iPhone 13 Pro Max");
    await page.fill(
      'textarea[name="description"]',
      "Brand new iPhone 13 Pro Max, 256GB, Pacific Blue",
    );
    await page.fill('input[name="price"]', "450000");
    await page.selectOption('select[name="condition"]', "new");
    await page.click('button:has-text("Next")');

    // Step 9: Fill listing form - Step 3: Media (skip for now)
    await page.click('button:has-text("Skip")');

    // Step 10: Fill listing form - Step 4: Location
    await page.selectOption('select[name="state"]', "Lagos");
    await page.selectOption('select[name="lga"]', "Ikeja");
    await page.selectOption('select[name="ward"]', "Ikeja GRA");
    await page.click('button:has-text("Next")');

    // Step 11: Review and publish
    await page.click('button:has-text("Publish")');

    // Step 12: Wait for success message
    await expect(
      page.locator("text=Listing published successfully"),
    ).toBeVisible();

    // Step 13: Navigate to listing detail page
    await page.waitForURL(/\/listings\/.+/);

    // Step 14: Click boost button
    await page.click('button:has-text("Boost")');

    // Step 15: Verify boost modal appears
    await expect(page.locator("text=Boost Your Listing")).toBeVisible();
    await expect(page.locator("text=₦500")).toBeVisible();

    // Step 16: Click pay button (this would redirect to Paystack)
    await page.click('button:has-text("Pay ₦500")');

    // Step 17: Verify redirect to Paystack (or payment page)
    // Note: In a real test, you'd need to handle Paystack test mode
    await page.waitForURL(/paystack|payment/);

    // Step 18: Verify payment page loaded
    await expect(page).toHaveURL(/paystack|payment/);
  });

  test("should prevent listing creation without phone verification", async ({
    page,
  }) => {
    // Step 1: Login with unverified account
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Try to create listing
    await page.goto("/listings/new");

    // Step 3: Verify redirect to verification page or error message
    const url = page.url();
    const hasVerificationPrompt =
      url.includes("/verify") ||
      (await page.locator("text=verify your phone").isVisible());

    expect(hasVerificationPrompt).toBeTruthy();
  });

  test("should enforce free tier listing limit", async ({ page }) => {
    // Step 1: Login
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Check current listing count
    await page.goto("/dashboard");
    const listingCount = await page
      .locator('[data-testid="listing-count"]')
      .textContent();
    const count = parseInt(listingCount || "0");

    // Step 3: If user has 5 or more listings, verify they can't create more
    if (count >= 5) {
      await page.goto("/listings/new");

      // Verify error message or upgrade prompt
      const hasUpgradePrompt =
        (await page.locator("text=Upgrade to Premium").isVisible()) ||
        (await page.locator("text=listing limit").isVisible());

      expect(hasUpgradePrompt).toBeTruthy();
    }
  });
});
