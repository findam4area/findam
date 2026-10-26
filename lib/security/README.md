# Security Headers Module

This module provides utilities for building Content Security Policy (CSP) directives and other security headers for the Findam marketplace application.

## CSP Configuration Builder

The `csp-builder.ts` module provides a reusable function to build CSP directive strings from configuration objects.

### Features

- **Environment-aware**: Automatically adjusts directives for development vs production
- **Third-party integration support**: Pre-configured for Paystack and Supabase
- **Type-safe**: Full TypeScript support with exported interfaces
- **Testable**: Pure functions that are easy to unit test
- **Maintainable**: Centralized CSP logic instead of inline configuration

### Usage

#### Basic Usage

```typescript
import { buildCSPForEnvironment } from './lib/security/csp-builder';

// Automatically detects NODE_ENV and builds appropriate CSP
const cspDirective = buildCSPForEnvironment();
```

#### Custom Configuration

```typescript
import { buildCSPDirectives, CSPConfig } from './lib/security/csp-builder';

const config: CSPConfig = {
  scriptSrc: ["'self'", "https://trusted-cdn.com"],
  imgSrc: ["'self'", "data:", "https://custom-images.com"],
  environment: 'production'
};

const cspDirective = buildCSPDirectives(config);
```

### Environment-Specific Behavior

#### Development Mode (`NODE_ENV=development`)

- Includes `'unsafe-eval'` in `script-src` for Next.js Fast Refresh
- Includes `ws://localhost:*` and `http://localhost:*` in `connect-src` for hot reload

#### Production Mode (`NODE_ENV=production`)

- Excludes `'unsafe-eval'` for stricter security
- Excludes localhost connections
- Enforces strict CSP policies

### Default Configuration

The builder includes sensible defaults that satisfy security requirements:

| Directive | Default Value | Purpose |
|-----------|---------------|---------|
| `default-src` | `'self'` | Only load resources from same origin by default |
| `script-src` | `'self' 'unsafe-inline' https://js.paystack.co` | Allow Next.js hydration and Paystack scripts |
| `style-src` | `'self' 'unsafe-inline'` | Allow inline styles for styled-components |
| `img-src` | `'self' data: blob: https: *.supabase.co res.cloudinary.com` | Support Supabase storage and Cloudinary |
| `connect-src` | `'self' *.supabase.co https://api.paystack.co` | Allow API calls to backend services |
| `object-src` | `'none'` | Block plugins (Flash, Java applets) |
| `frame-ancestors` | `'none'` | Prevent clickjacking by disallowing embedding |
| `frame-src` | `'self' https://js.paystack.co` | Allow Paystack payment widget |

### Adding New Allowed Origins

To add a new third-party service:

1. Update the default configuration in `csp-builder.ts`:

```typescript
const DEFAULT_CSP_CONFIG = {
  scriptSrc: ["'self'", "'unsafe-inline'", "https://js.paystack.co", "https://new-service.com"],
  // ... other directives
};
```

2. Update the tests in `csp-builder.test.ts`:

```typescript
it('should include new service in script-src', () => {
  const csp = buildCSPDirectives();
  expect(csp).toContain('https://new-service.com');
});
```

3. Run tests to verify:

```bash
npm run test -- csp-builder.test.ts
```

### Integration with Next.js

The CSP builder is integrated in `next.config.ts`:

```typescript
import { buildCSPForEnvironment } from './lib/security/csp-builder';

const nextConfig: NextConfig = {
  async headers() {
    const cspDirectives = buildCSPForEnvironment();
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          // ... other security headers
        ],
      },
    ];
  },
};
```

### Testing

The module includes comprehensive unit tests:

```bash
# Run CSP builder tests
npm run test -- csp-builder.test.ts

# Run all security tests
npm run test -- lib/security
```

### Requirements Traceability

This module satisfies the following requirements from the Production Security Hardening specification:

- **2.1**: Default-src 'self'
- **2.2**: Script-src includes Paystack and unsafe-inline for Next.js
- **2.3**: Img-src includes Supabase storage, Cloudinary, and data URIs
- **2.4**: Connect-src includes Supabase and Paystack APIs
- **2.5**: Frame-ancestors 'none' prevents clickjacking
- **2.6**: Object-src 'none' blocks plugins
- **2.7**: Unsafe-eval excluded in production
- **2.8**: Localhost WebSocket connections in development

### Troubleshooting

#### CSP violations in development

If you see CSP violations in the browser console during development, ensure you're using the development environment:

```bash
NODE_ENV=development npm run dev
```

#### New resource blocked by CSP

If a new resource is blocked:

1. Check the browser console for the CSP violation report
2. Identify which directive needs updating (e.g., `script-src`, `img-src`)
3. Update the configuration in `csp-builder.ts`
4. Add tests to verify the change
5. Restart the development server

#### Production CSP too strict

If production CSP is blocking legitimate resources:

1. Avoid adding `'unsafe-eval'` or `'unsafe-inline'` to production
2. Instead, whitelist specific origins
3. Use nonces or hashes for inline scripts if needed
4. Consider using a CSP report-only mode initially to test

### Future Enhancements

Potential improvements for this module:

- [ ] Support for CSP nonces for inline scripts
- [ ] Support for CSP hashes for inline styles
- [ ] CSP report-uri configuration
- [ ] Automatic CSP violation reporting to Sentry
- [ ] CSP report-only mode for testing
- [ ] Per-route CSP configuration
