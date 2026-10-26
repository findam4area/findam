# FindAm E2E Tests

This directory contains end-to-end tests for the FindAm marketplace platform using Playwright.

## Overview

The E2E tests cover critical user paths and flows:

1. **Registration → Listing Creation → Boost Flow** (`registration-listing-boost.spec.ts`)
   - User registration with email/password
   - Phone verification
   - Listing creation (multi-step form)
   - Listing boost with Paystack payment
   - Free tier listing limits

2. **Search and Filter Flow** (`search-filter-flow.spec.ts`)
   - Text search with autocomplete
   - Category filtering
   - Price range filtering
   - Location filtering (State → LGA → Ward)
   - Combined filters
   - Sort functionality (price, date)
   - Recent searches

3. **Messaging Flow** (`messaging-flow.spec.ts`)
   - Initiate conversation from listing
   - Send and receive messages
   - Real-time message delivery
   - Typing indicators
   - Image sharing
   - Read receipts
   - Scam detection warnings
   - Phone number hiding/revealing
   - Safety tips display

## Prerequisites

1. **Install Playwright browsers**:

   ```bash
   npx playwright install chromium
   ```

2. **Environment Setup**:
   - Ensure the development server is running or configure `webServer` in `playwright.config.ts`
   - Set up test database with Supabase
   - Configure test environment variables

3. **Test Data**:
   - Tests create test users dynamically with timestamps
   - Ensure Supabase allows user registration
   - Configure test phone numbers for OTP verification

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

### Run specific test file

```bash
npx playwright test e2e/registration-listing-boost.spec.ts
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

## Test Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browser**: Chromium (Desktop Chrome)
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry
- **Web Server**: Automatically starts `npm run dev` before tests

## Test Structure

Each test file follows this structure:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test("should do something", async ({ page }) => {
    // Test steps
    // Assertions
  });
});
```

## Best Practices

1. **Use data-testid attributes**: Prefer `[data-testid="element-name"]` selectors for stability
2. **Wait for elements**: Use `waitForSelector`, `waitForURL`, or `waitForTimeout` appropriately
3. **Verify state changes**: Always assert expected outcomes after actions
4. **Clean up test data**: Tests should be idempotent and not leave artifacts
5. **Use descriptive test names**: Test names should clearly describe what is being tested

## Test Data Management

Tests use dynamic test data with timestamps to avoid conflicts:

```typescript
const testEmail = `test-${Date.now()}@example.com`;
const testUsername = `testuser${Date.now()}`;
```

## Debugging Tests

### View test report

```bash
npx playwright show-report
```

### Generate trace viewer

```bash
npx playwright show-trace trace.zip
```

### Use Playwright Inspector

```bash
npx playwright test --debug
```

## CI/CD Integration

The tests are configured to run in CI environments:

- Retries are enabled (2 retries)
- Single worker for stability
- HTML reporter for test results
- Screenshots and traces captured on failure

## Known Limitations

1. **Phone OTP Verification**: Tests currently skip actual OTP verification. In production, integrate with a test SMS service.
2. **Paystack Integration**: Tests verify redirect to Paystack but don't complete actual payments. Use Paystack test mode for full integration.
3. **Real-time Features**: Some real-time tests use timeouts. Consider using Playwright's `waitForEvent` for more reliable testing.
4. **Image Uploads**: Tests require test images in the `public` directory.

## Troubleshooting

### Tests fail with "Element not found"

- Ensure the development server is running
- Check that data-testid attributes are present in components
- Increase timeout values if needed

### Tests fail with "Navigation timeout"

- Check that the base URL is correct
- Ensure the development server starts successfully
- Verify network connectivity

### Tests fail intermittently

- Add appropriate wait conditions
- Check for race conditions in real-time features
- Increase retries in CI configuration

## Future Improvements

1. Add visual regression testing with Playwright screenshots
2. Integrate with test SMS service for OTP verification
3. Add performance testing with Playwright metrics
4. Implement test data seeding for consistent test environments
5. Add accessibility testing with axe-playwright
6. Create page object models for better test maintainability

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
