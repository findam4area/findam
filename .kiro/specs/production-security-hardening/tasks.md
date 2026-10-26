# Implementation Plan: Production Security Hardening

## Overview

This implementation plan converts the production security hardening design into actionable coding tasks. The implementation covers three critical security domains:

1. **Security Headers System** - HTTP security headers in Next.js configuration
2. **Database Performance Optimization** - Strategic indexing for RLS policies and search operations  
3. **Error Monitoring Infrastructure** - Comprehensive Sentry integration across client, server, and edge runtimes

The tasks are organized to allow incremental progress with early validation checkpoints. Each task builds on previous work and includes specific requirements references for traceability.

## Tasks

- [x] 1. Configure security headers in Next.js
  - Update `next.config.ts` to add comprehensive security headers
  - Configure environment-aware CSP directives (development vs production)
  - Set HSTS header with 2-year max-age for production
  - Configure X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
  - Remove X-Powered-By header to prevent technology disclosure
  - Add CSP directives for Paystack payment gateway and Supabase storage
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Implement Content Security Policy directives
  - [x] 2.1 Create CSP configuration builder function
    - Write TypeScript function to build CSP directive string from configuration object
    - Handle environment-specific directives (unsafe-eval in dev, strict in prod)
    - Support Paystack (`https://js.paystack.co`), Supabase storage, and data URIs
    - Include localhost WebSocket connections for development hot reload
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 2.2 Configure CSP for third-party integrations
    - Add Paystack domains to script-src and frame-src for payment widget
    - Add Supabase storage patterns to img-src and connect-src
    - Configure Cloudinary domains for image hosting
    - Set frame-ancestors to 'none' to prevent clickjacking
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 3. Create database migration for RLS policy indexes
  - [x] 3.1 Create migration file for listings table indexes
    - Create `supabase/migrations/058_security_hardening_indexes.sql`
    - Add indexes on `user_id`, `status`, `is_active` columns
    - Create composite index on `(status, is_active)` with partial index WHERE clause
    - Create composite index on `(category_id, state, is_active, status)` for category browsing
    - Create composite index on `(state, lga, is_active, status)` for location browsing
    - Use `CREATE INDEX CONCURRENTLY` for zero-downtime deployment
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 3.2 Create indexes for product and service listings tables
    - Add index on `product_listings.is_active` column
    - Add index on `product_listings.business_profile_id` column
    - Add index on `service_listings.is_active` column
    - Add index on `service_listings.business_profile_id` column
    - Use `CREATE INDEX CONCURRENTLY` for all indexes
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Verify configuration and migration files
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Set up Sentry project and configuration
  - [x] 5.1 Install Sentry SDK and configure environment variables
    - Install `@sentry/nextjs` package
    - Set up environment variables: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
    - Document environment variable setup in `.env.example`
    - _Requirements: 9.1, 9.5_
  
  - [x] 5.2 Initialize Sentry with Next.js wizard
    - Run `npx @sentry/wizard@latest -i nextjs`
    - Verify creation of `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
    - Configure `next.config.ts` for source map upload
    - _Requirements: 7.1, 7.6_

- [x] 6. Implement Sentry client-side error tracking
  - [x] 6.1 Configure Sentry client SDK with integrations
    - Update `sentry.client.config.ts` with environment-aware configuration
    - Configure `replayIntegration` with privacy settings (maskAllText, blockAllMedia)
    - Set up session replay sampling: 10% normal sessions, 100% error sessions
    - Configure `browserTracingIntegration` for performance monitoring
    - Set transaction sample rate to 10% for production
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.3, 9.4_
  
  - [x] 6.2 Implement client-side error filtering and scrubbing
    - Write `beforeSend` hook to filter non-critical errors (browser extensions, cancelled requests)
    - Filter ResizeObserver loop exceeded errors
    - Scrub PII from user context (remove email and name, keep ID)
    - Tag critical errors (payment failures, auth failures, security breaches)
    - _Requirements: 5.6, 5.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7. Implement Sentry server-side error tracking
  - [x] 7.1 Configure Sentry server SDK
    - Update `sentry.server.config.ts` with environment-aware configuration
    - Set transaction sample rate to 10% for production
    - Configure Node.js-specific context capture
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.3, 9.4_
  
  - [x] 7.2 Implement server-side error filtering and scrubbing
    - Write `beforeSend` hook to filter connection errors (ECONNREFUSED, ETIMEDOUT)
    - Scrub environment variables and secrets from error context
    - Scrub sensitive data from request body (password, token, cardNumber)
    - Tag critical server errors (database failures, unauthorized access)
    - Ignore health check transactions (`/api/health`, `/api/ping`)
    - _Requirements: 6.6, 6.7, 8.7_

- [x] 8. Configure Sentry edge runtime and middleware
  - Update `sentry.edge.config.ts` with minimal configuration for Edge runtime
  - Configure environment-aware sampling (100% dev, 10% production)
  - Test middleware error capture
  - _Requirements: 6.3, 9.1, 9.2_

- [x] 9. Implement React error boundaries with Sentry
  - [x] 9.1 Create root error boundary
    - Update `app/error.tsx` to capture errors with Sentry
    - Display user-friendly error message
    - Include "Try again" reset button
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 9.2 Create route-specific error boundaries
    - Update `app/(main)/error.tsx` for main layout errors
    - Update `app/(admin)/admin/error.tsx` for admin panel errors
    - Ensure all error boundaries call `Sentry.captureException`
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Configure Sentry source maps for production
  - Configure Sentry Webpack plugin in `next.config.ts` (auto-configured by `@sentry/nextjs`)
  - Set `productionBrowserSourceMaps: false` to prevent public exposure
  - Configure release tagging with git commit SHA
  - Set up source map upload during build
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 11. Checkpoint - Test Sentry integration locally
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create security headers validation script
  - [x] 12.1 Implement header validation logic
    - Create `scripts/validate-security-headers.ts`
    - Fetch headers from test endpoint
    - Validate presence of required headers (CSP, HSTS, X-Frame-Options, etc.)
    - Parse and validate CSP directives
    - Validate HSTS max-age >= 31536000 seconds
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 12.2 Implement validation report generation
    - Generate structured report with passed/failed/warnings
    - Export report as JSON and formatted text
    - Add npm script: `npm run validate:headers`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 13. Create database index verification script
  - [x] 13.1 Implement index query functions
    - Create `scripts/verify-database-indexes.ts`
    - Write SQL queries to list indexes on listings, product_listings, service_listings tables
    - Query `pg_indexes` and `pg_attribute` for index details
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 13.2 Implement index verification logic
    - Define required indexes for each table
    - Check for missing indexes
    - Generate verification report showing existing vs required indexes
    - Add npm script: `npm run verify:indexes`
    - _Requirements: 11.5, 11.6_

- [x] 14. Create CSP report endpoint
  - [x] 14.1 Implement CSP violation reporting API
    - Create `app/api/csp-report/route.ts`
    - Parse CSP violation reports from browser
    - Log violations to Sentry with appropriate tags
    - Return 204 No Content response
    - _Requirements: 10.5_
  
  - [x] 14.2 Add report-uri to CSP header
    - Update CSP configuration to include `report-uri /api/csp-report`
    - Add `report-to` directive for modern browsers
    - _Requirements: 10.5_

- [x] 15. Apply database migration to development environment
  - Run `supabase db push` to apply index migration
  - Verify indexes created with verification script
  - Test query performance with EXPLAIN ANALYZE
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 16. Create documentation for security hardening
  - [x] 16.1 Document security headers configuration
    - Create `docs/security/headers.md`
    - Document all security headers and their values
    - Explain each CSP directive and its purpose
    - Document how to add new allowed origins
    - Include testing and monitoring procedures
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 16.2 Document database indexes
    - Create `docs/database/indexes.md`
    - List all indexes and their purpose
    - Document query patterns each index optimizes
    - Include EXPLAIN ANALYZE examples
    - Document index maintenance procedures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 16.3 Document Sentry integration
    - Create `docs/monitoring/sentry.md`
    - Document Sentry dashboard access and team invitation
    - Explain error severity levels and alerting rules
    - Document session replay usage for debugging
    - Include source map troubleshooting guide
    - Document quota management and sampling configuration
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 17. Checkpoint - Verify all components integrated
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 18. Write integration tests for security headers
  - [ ]* 18.1 Test security header presence
    - Create `__tests__/security-headers.test.ts`
    - Test CSP header presence and correct directives
    - Test HSTS header with correct max-age
    - Test X-Frame-Options, X-Content-Type-Options, Referrer-Policy presence
    - Test X-Powered-By header removal
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ]* 18.2 Test CSP directive configuration
    - Test default-src includes 'self'
    - Test script-src includes Paystack domain
    - Test img-src includes Supabase and Cloudinary patterns
    - Test frame-ancestors is 'none'
    - Test environment-specific directives (dev vs prod)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ]* 19. Write integration tests for Sentry error filtering
  - [ ]* 19.1 Test client-side error filtering
    - Create `__tests__/sentry-filtering.test.ts`
    - Test browser extension errors are filtered
    - Test cancelled request errors are filtered
    - Test ResizeObserver errors are filtered
    - Test critical payment errors are tagged
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 19.2 Test PII scrubbing
    - Test email and name removed from user context
    - Test password removed from request data
    - Test environment variables scrubbed from error context
    - _Requirements: 5.6, 5.7, 6.6, 6.7_

- [ ]* 20. Write database index verification tests
  - [ ]* 20.1 Test index existence
    - Create `__tests__/database-indexes.test.ts`
    - Test idx_listings_user_id exists
    - Test idx_listings_status_active exists
    - Test idx_listings_category_browse exists with correct columns
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.5, 4.6_
  
  - [ ]* 20.2 Test index usage with EXPLAIN ANALYZE
    - Test public listing query uses idx_listings_status_active
    - Test category browse uses idx_listings_category_browse
    - Test owner query uses idx_listings_user_id
    - Verify "Rows Removed by Filter" is 0 or minimal
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 21. Final checkpoint - Production readiness verification
  - Run all verification scripts and tests
  - Review Sentry dashboard for test events
  - Verify security headers in staging environment
  - Confirm database indexes created successfully
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster deployment
- Security headers are applied via Next.js configuration without code changes to routes
- Database indexes use `CREATE INDEX CONCURRENTLY` for zero-downtime deployment
- Sentry integration requires environment variables to be set before testing
- Source maps are uploaded automatically during production builds
- All verification scripts output structured reports for monitoring
- CSP violations are reported to Sentry for monitoring
- Session replays are privacy-first with text masking and media blocking enabled

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "5.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.2"] },
    { "id": 2, "tasks": ["2.2", "3.2", "6.1"] },
    { "id": 3, "tasks": ["6.2", "7.1", "8"] },
    { "id": 4, "tasks": ["7.2", "9.1", "10"] },
    { "id": 5, "tasks": ["9.2", "12.1", "13.1", "14.1"] },
    { "id": 6, "tasks": ["12.2", "13.2", "14.2"] },
    { "id": 7, "tasks": ["15", "16.1", "16.2", "16.3"] },
    { "id": 8, "tasks": ["18.1", "18.2", "19.1", "19.2", "20.1", "20.2"] }
  ]
}
```
