# Integration Tests

This directory contains comprehensive integration tests for the FindAm marketplace platform. These tests validate complete user flows and feature interactions across the application.

## Test Structure

### Test Files

1. **feed-flow.test.ts** - Feed browsing and discovery
   - Browse active listings
   - Apply filters (category, price, location, condition)
   - View listing details
   - Interact with listings (like, save)
   - Search functionality
   - Feed performance

2. **listing-creation-flow.test.ts** - Listing creation and management
   - Listing creation prerequisites
   - Validation (category, location, price)
   - Media upload (images/videos)
   - Listing limits (free vs premium tiers)
   - Phone verification requirement
   - Publication and visibility
   - Scam detection

3. **messaging-flow.test.ts** - Real-time messaging
   - Conversation management
   - Message sending and retrieval
   - Read receipts
   - Image sharing
   - Conversation list
   - Scam detection in messages
   - Real-time capabilities
   - Performance

4. **payment-flow.test.ts** - Payments and monetization
   - Payment infrastructure
   - Boost listing payment (₦500)
   - Premium subscription (₦5,999/month)
   - Payment verification
   - Premium features access
   - Subscription expiration
   - Payment history
   - Security

5. **search-filter-flow.test.ts** - Search and filtering
   - Text search with autocomplete
   - Category filtering
   - Price range filtering
   - Location filtering
   - Condition filtering
   - Combined filters
   - Sort functionality
   - Search history
   - Performance

## Running Tests

### Run all integration tests

```bash
npm test -- lib/__tests__/integration --run
```

### Run specific test file

```bash
npm test -- lib/__tests__/integration/feed-flow.test.ts --run
npm test -- lib/__tests__/integration/listing-creation-flow.test.ts --run
npm test -- lib/__tests__/integration/messaging-flow.test.ts --run
npm test -- lib/__tests__/integration/payment-flow.test.ts --run
npm test -- lib/__tests__/integration/search-filter-flow.test.ts --run
```

### Run in watch mode

```bash
npm test -- lib/__tests__/integration
```

### Run with coverage

```bash
npm test -- lib/__tests__/integration --coverage
```

## Test Philosophy

These integration tests follow these principles:

1. **Real Database Queries**: Tests use actual Supabase client to validate database schema and queries
2. **Graceful Handling**: Tests handle missing data gracefully (empty tables, no auth)
3. **Schema Validation**: Tests verify table structure and relationships exist
4. **Business Logic**: Tests validate business rules (limits, permissions, calculations)
5. **Performance**: Tests include performance checks for critical queries
6. **Security**: Tests verify RLS policies and data protection

## Test Environment

- **Database**: Tests connect to Supabase (configured via environment variables)
- **Authentication**: Most tests work without authentication, testing public queries
- **Data**: Tests work with existing data or verify empty states gracefully

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Expected Behavior

### With Empty Database

- Tests verify table structure exists
- Tests handle empty result sets gracefully
- No test failures due to missing data

### With Seeded Database

- Tests validate data integrity
- Tests verify business logic
- Tests check relationships and constraints

## Common Patterns

### Testing Table Existence

```typescript
const { error } = await supabase.from("table_name").select("*").limit(1);

expect(error?.code).not.toBe("42P01"); // Table doesn't exist
```

### Testing Data Integrity

```typescript
if (data && data.length > 0) {
  data.forEach((item) => {
    expect(item.required_field).toBeDefined();
    expect(item.numeric_field).toBeGreaterThanOrEqual(0);
  });
}
```

### Testing Relationships

```typescript
const { data } = await supabase
  .from("parent")
  .select(
    `
    id,
    child:children(id, name)
  `,
  )
  .limit(1);

if (data && data.length > 0) {
  expect(data[0].child).toBeDefined();
}
```

## Troubleshooting

### Connection Errors

- Verify Supabase URL and anon key in `.env.local`
- Check network connectivity
- Verify Supabase project is active

### RLS Policy Errors

- Expected for authenticated-only operations
- Tests should handle gracefully with error code checks

### Performance Issues

- Check database indexes
- Verify query optimization
- Consider connection pooling

## Contributing

When adding new integration tests:

1. Follow existing file structure and naming
2. Group related tests in describe blocks
3. Handle empty data gracefully
4. Include performance checks for critical paths
5. Document test purpose in file header
6. Add test file to this README

## Coverage Goals

Integration tests should cover:

- ✅ All major user flows
- ✅ Database schema validation
- ✅ Business logic enforcement
- ✅ Performance requirements
- ✅ Security policies
- ✅ Error handling

## Next Steps

Consider adding:

- Authentication flow tests (with test users)
- Admin dashboard tests
- Notification system tests
- Story feature tests
- Portfolio feature tests
- Review system tests
