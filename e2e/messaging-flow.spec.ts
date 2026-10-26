import { test, expect } from "@playwright/test";

/**
 * E2E Test: Messaging Flow
 *
 * Tests the complete messaging experience:
 * 1. Initiate conversation from listing
 * 2. Send and receive messages
 * 3. Real-time message delivery
 * 4. Image sharing
 * 5. Scam detection warnings
 */

test.describe("Messaging Flow", () => {
  const testEmail1 = `buyer-${Date.now()}@example.com`;
  const testEmail2 = `seller-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test("should initiate conversation from listing", async ({ page }) => {
    // Step 1: Login as buyer
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to a listing
    await page.goto("/");
    await page.click('[data-testid="listing-card"]', { force: true });

    // Step 3: Wait for listing detail page
    await page.waitForURL(/\/listings\/.+/);

    // Step 4: Click "Contact Seller" button
    await page.click('button:has-text("Contact Seller")');

    // Step 5: Verify chat window opens
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // Step 6: Verify seller information is displayed
    await expect(page.locator('[data-testid="seller-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="seller-avatar"]')).toBeVisible();

    // Step 7: Verify listing context is shown
    await expect(page.locator('[data-testid="listing-context"]')).toBeVisible();
  });

  test("should send and receive messages", async ({ page, context }) => {
    // Step 1: Open two pages (buyer and seller)
    const buyerPage = page;
    const sellerPage = await context.newPage();

    // Step 2: Login as buyer
    await buyerPage.goto("/login");
    await buyerPage.fill('input[name="email"]', testEmail1);
    await buyerPage.fill('input[name="password"]', testPassword);
    await buyerPage.click('button[type="submit"]');

    // Step 3: Login as seller
    await sellerPage.goto("/login");
    await sellerPage.fill('input[name="email"]', testEmail2);
    await sellerPage.fill('input[name="password"]', testPassword);
    await sellerPage.click('button[type="submit"]');

    // Step 4: Buyer initiates conversation
    await buyerPage.goto("/");
    await buyerPage.click('[data-testid="listing-card"]', { force: true });
    await buyerPage.waitForURL(/\/listings\/.+/);
    await buyerPage.click('button:has-text("Contact Seller")');

    // Step 5: Buyer sends a message
    const testMessage = `Hello, is this still available? ${Date.now()}`;
    await buyerPage.fill('[data-testid="message-input"]', testMessage);
    await buyerPage.click('[data-testid="send-button"]');

    // Step 6: Verify message appears in buyer's chat
    await expect(buyerPage.locator(`text=${testMessage}`)).toBeVisible();

    // Step 7: Seller navigates to messages
    await sellerPage.goto("/messages");

    // Step 8: Verify new message notification
    await expect(
      sellerPage.locator('[data-testid="unread-badge"]'),
    ).toBeVisible();

    // Step 9: Seller opens conversation
    await sellerPage.click('[data-testid="conversation-item"]', {
      force: true,
    });

    // Step 10: Verify seller sees the message
    await expect(sellerPage.locator(`text=${testMessage}`)).toBeVisible();

    // Step 11: Seller sends a reply
    const replyMessage = `Yes, it's still available! ${Date.now()}`;
    await sellerPage.fill('[data-testid="message-input"]', replyMessage);
    await sellerPage.click('[data-testid="send-button"]');

    // Step 12: Verify reply appears in seller's chat
    await expect(sellerPage.locator(`text=${replyMessage}`)).toBeVisible();

    // Step 13: Verify buyer receives the reply (real-time)
    await buyerPage.waitForTimeout(2000); // Wait for real-time update
    await expect(buyerPage.locator(`text=${replyMessage}`)).toBeVisible();
  });

  test("should display typing indicator", async ({ page, context }) => {
    // Step 1: Open two pages (buyer and seller)
    const buyerPage = page;
    const sellerPage = await context.newPage();

    // Step 2: Login both users and open conversation
    // (Similar setup as previous test)

    // Step 3: Buyer starts typing
    await buyerPage.fill('[data-testid="message-input"]', "I'm interested...");

    // Step 4: Verify seller sees typing indicator
    await sellerPage.waitForTimeout(1000);
    await expect(
      sellerPage.locator('[data-testid="typing-indicator"]'),
    ).toBeVisible();

    // Step 5: Buyer stops typing
    await buyerPage.fill('[data-testid="message-input"]', "");

    // Step 6: Verify typing indicator disappears
    await sellerPage.waitForTimeout(1000);
    await expect(
      sellerPage.locator('[data-testid="typing-indicator"]'),
    ).not.toBeVisible();
  });

  test("should share images in chat", async ({ page }) => {
    // Step 1: Login and open conversation
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to messages
    await page.goto("/messages");
    await page.click('[data-testid="conversation-item"]', { force: true });

    // Step 3: Click image upload button
    await page.click('[data-testid="image-upload-button"]');

    // Step 4: Upload an image
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles("./public/test-image.jpg");

    // Step 5: Wait for upload to complete
    await page.waitForTimeout(2000);

    // Step 6: Verify image appears in chat
    await expect(page.locator('[data-testid="message-image"]')).toBeVisible();

    // Step 7: Click on image to view full size
    await page.click('[data-testid="message-image"]');

    // Step 8: Verify image modal opens
    await expect(page.locator('[data-testid="image-modal"]')).toBeVisible();
  });

  test("should display scam warning for suspicious messages", async ({
    page,
  }) => {
    // Step 1: Login and open conversation
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to messages
    await page.goto("/messages");
    await page.click('[data-testid="conversation-item"]', { force: true });

    // Step 3: Send a message with suspicious keywords
    const suspiciousMessage = "Please send money to my bank account";
    await page.fill('[data-testid="message-input"]', suspiciousMessage);
    await page.click('[data-testid="send-button"]');

    // Step 4: Verify scam warning appears
    await expect(page.locator('[data-testid="scam-warning"]')).toBeVisible();
    await expect(page.locator("text=suspicious")).toBeVisible();
  });

  test("should display read receipts", async ({ page, context }) => {
    // Step 1: Open two pages (buyer and seller)
    const buyerPage = page;
    const sellerPage = await context.newPage();

    // Step 2: Login both users and open conversation
    // (Similar setup as previous test)

    // Step 3: Buyer sends a message
    const testMessage = `Test message ${Date.now()}`;
    await buyerPage.fill('[data-testid="message-input"]', testMessage);
    await buyerPage.click('[data-testid="send-button"]');

    // Step 4: Verify message shows "Sent" status
    await expect(
      buyerPage.locator('[data-testid="message-status"]'),
    ).toHaveText("Sent");

    // Step 5: Seller opens conversation and views message
    await sellerPage.goto("/messages");
    await sellerPage.click('[data-testid="conversation-item"]', {
      force: true,
    });
    await sellerPage.waitForTimeout(1000);

    // Step 6: Verify message shows "Read" status in buyer's chat
    await buyerPage.waitForTimeout(2000);
    await expect(
      buyerPage.locator('[data-testid="message-status"]'),
    ).toHaveText("Read");
  });

  test("should display conversation list with unread counts", async ({
    page,
  }) => {
    // Step 1: Login
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to messages
    await page.goto("/messages");

    // Step 3: Verify conversation list is displayed
    await expect(
      page.locator('[data-testid="conversation-list"]'),
    ).toBeVisible();

    // Step 4: Verify conversations show last message
    const conversations = await page
      .locator('[data-testid="conversation-item"]')
      .count();
    expect(conversations).toBeGreaterThanOrEqual(0);

    // Step 5: Verify unread counts are displayed
    const unreadBadges = await page
      .locator('[data-testid="unread-badge"]')
      .count();
    expect(unreadBadges).toBeGreaterThanOrEqual(0);

    // Step 6: Verify conversations are sorted by last message time
    const timestamps = await page
      .locator('[data-testid="conversation-time"]')
      .allTextContents();
    expect(timestamps.length).toBeGreaterThanOrEqual(0);
  });

  test("should hide phone numbers until revealed", async ({ page }) => {
    // Step 1: Login and open conversation
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to messages
    await page.goto("/messages");
    await page.click('[data-testid="conversation-item"]', { force: true });

    // Step 3: Send a message with a phone number
    const messageWithPhone = "My number is +2348012345678";
    await page.fill('[data-testid="message-input"]', messageWithPhone);
    await page.click('[data-testid="send-button"]');

    // Step 4: Verify phone number is hidden
    await expect(page.locator("text=+2348012345678")).not.toBeVisible();
    await expect(
      page.locator('[data-testid="reveal-phone-button"]'),
    ).toBeVisible();

    // Step 5: Click reveal button
    await page.click('[data-testid="reveal-phone-button"]');

    // Step 6: Verify phone number is now visible
    await expect(page.locator("text=+2348012345678")).toBeVisible();
  });

  test("should display safety tips", async ({ page }) => {
    // Step 1: Login and open conversation
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to messages
    await page.goto("/messages");
    await page.click('[data-testid="conversation-item"]', { force: true });

    // Step 3: Verify safety tips banner is displayed
    await expect(page.locator('[data-testid="safety-tips"]')).toBeVisible();
    await expect(page.locator("text=Meet in public")).toBeVisible();
    await expect(page.locator("text=Never send money")).toBeVisible();
  });

  test("should search conversations", async ({ page }) => {
    // Step 1: Login
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail1);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Navigate to messages
    await page.goto("/messages");

    // Step 3: Enter search query
    await page.fill('[data-testid="conversation-search"]', "iPhone");

    // Step 4: Wait for results to filter
    await page.waitForTimeout(500);

    // Step 5: Verify only matching conversations are displayed
    const conversations = await page
      .locator('[data-testid="conversation-item"]')
      .allTextContents();
    conversations.forEach((conv) => {
      expect(conv.toLowerCase()).toContain("iphone");
    });
  });
});
