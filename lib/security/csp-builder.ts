/**
 * Content Security Policy (CSP) Configuration Builder
 * 
 * This module provides a reusable function to build CSP directive strings
 * from configuration objects. It handles environment-specific directives
 * (unsafe-eval in dev, strict in prod) and supports third-party integrations
 * like Paystack and Supabase.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

/**
 * Configuration object for CSP directives
 */
export interface CSPConfig {
  /** Default source for all content types */
  defaultSrc?: string[];
  /** Sources for JavaScript */
  scriptSrc?: string[];
  /** Sources for CSS stylesheets */
  styleSrc?: string[];
  /** Sources for images */
  imgSrc?: string[];
  /** Sources for fonts */
  fontSrc?: string[];
  /** Sources for XHR, WebSocket, and EventSource connections */
  connectSrc?: string[];
  /** Sources for media (audio/video) */
  mediaSrc?: string[];
  /** Sources for plugins (Flash, etc.) */
  objectSrc?: string[];
  /** Sources allowed to embed the page in frames */
  frameSrc?: string[];
  /** Sources allowed to embed this page */
  frameAncestors?: string[];
  /** Allowed form submission targets */
  formAction?: string[];
  /** Allowed base URIs */
  baseUri?: string[];
  /** Whether to upgrade insecure requests to HTTPS */
  upgradeInsecureRequests?: boolean;
  /** Environment: development or production */
  environment?: 'development' | 'production';
  /** URI to send CSP violation reports (Requirement 10.5) */
  reportUri?: string;
  /** Report-To endpoint name for modern browsers (Requirement 10.5) */
  reportTo?: string;
}

/**
 * Default CSP configuration that balances security and functionality
 * 
 * Requirement 2.1: default-src 'self'
 * Requirement 2.2: Allow scripts from Paystack payment gateway
 * Requirement 2.3: Allow images from Supabase storage and Cloudinary CDN
 * Requirement 2.4: Allow connections to Supabase and Paystack APIs
 * Requirement 2.5: Prevent clickjacking with frame-ancestors 'none'
 * Requirement 2.6: Block plugins with object-src 'none'
 * 
 * Third-Party Integration Domains:
 * 
 * PAYSTACK (Payment Gateway):
 * - https://js.paystack.co - Payment widget JavaScript (script-src, frame-src)
 * - https://api.paystack.co - Payment API endpoints (connect-src)
 * 
 * SUPABASE (Backend & Storage):
 * - *.supabase.co - Database API, Realtime, and Storage (img-src, media-src, connect-src)
 * 
 * CLOUDINARY (Image CDN):
 * - res.cloudinary.com - Optimized image delivery (img-src)
 */
const DEFAULT_CSP_CONFIG: Required<Omit<CSPConfig, 'environment'>> = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://js.paystack.co"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "blob:", "https:", "*.supabase.co", "res.cloudinary.com"],
  fontSrc: ["'self'", "data:"],
  connectSrc: ["'self'", "*.supabase.co", "https://api.paystack.co"],
  mediaSrc: ["'self'", "blob:", "*.supabase.co"],
  objectSrc: ["'none'"],
  frameSrc: ["'self'", "https://js.paystack.co"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  upgradeInsecureRequests: true,
  reportUri: "/api/csp-report",
  reportTo: "csp-endpoint",
};

/**
 * Builds a Content Security Policy directive string from configuration object
 * 
 * This function handles environment-specific directives:
 * - Development: Includes 'unsafe-eval' for script-src (Next.js Fast Refresh)
 * - Development: Includes localhost WebSocket connections for hot reload
 * - Production: Strict CSP without unsafe-eval
 * 
 * @param config - CSP configuration object (merged with defaults)
 * @returns CSP directive string ready to be used in HTTP headers
 * 
 * @example
 * ```typescript
 * // Development environment
 * const csp = buildCSPDirectives({ environment: 'development' });
 * // Output includes 'unsafe-eval' and localhost connections
 * 
 * // Production environment
 * const csp = buildCSPDirectives({ environment: 'production' });
 * // Output excludes unsafe-eval for stricter security
 * 
 * // Custom configuration
 * const csp = buildCSPDirectives({
 *   scriptSrc: ["'self'", "https://trusted-cdn.com"],
 *   environment: 'production'
 * });
 * ```
 */
export function buildCSPDirectives(config: CSPConfig = {}): string {
  const isDevelopment = config.environment === 'development';
  
  // Merge user config with defaults
  const mergedConfig: Required<Omit<CSPConfig, 'environment'>> = {
    defaultSrc: config.defaultSrc || DEFAULT_CSP_CONFIG.defaultSrc,
    scriptSrc: config.scriptSrc || DEFAULT_CSP_CONFIG.scriptSrc,
    styleSrc: config.styleSrc || DEFAULT_CSP_CONFIG.styleSrc,
    imgSrc: config.imgSrc || DEFAULT_CSP_CONFIG.imgSrc,
    fontSrc: config.fontSrc || DEFAULT_CSP_CONFIG.fontSrc,
    connectSrc: config.connectSrc || DEFAULT_CSP_CONFIG.connectSrc,
    mediaSrc: config.mediaSrc || DEFAULT_CSP_CONFIG.mediaSrc,
    objectSrc: config.objectSrc || DEFAULT_CSP_CONFIG.objectSrc,
    frameSrc: config.frameSrc || DEFAULT_CSP_CONFIG.frameSrc,
    frameAncestors: config.frameAncestors || DEFAULT_CSP_CONFIG.frameAncestors,
    formAction: config.formAction || DEFAULT_CSP_CONFIG.formAction,
    baseUri: config.baseUri || DEFAULT_CSP_CONFIG.baseUri,
    upgradeInsecureRequests: config.upgradeInsecureRequests ?? DEFAULT_CSP_CONFIG.upgradeInsecureRequests,
    reportUri: config.reportUri || DEFAULT_CSP_CONFIG.reportUri,
    reportTo: config.reportTo || DEFAULT_CSP_CONFIG.reportTo,
  };

  // Requirement 2.7: Include 'unsafe-eval' in development, exclude in production
  const scriptSrc = [...mergedConfig.scriptSrc];
  if (isDevelopment && !scriptSrc.includes("'unsafe-eval'")) {
    // Add unsafe-eval after 'self' for Next.js Fast Refresh
    const selfIndex = scriptSrc.indexOf("'self'");
    if (selfIndex !== -1) {
      scriptSrc.splice(selfIndex + 1, 0, "'unsafe-eval'");
    } else {
      scriptSrc.unshift("'unsafe-eval'");
    }
  }

  // Requirement 2.8: Include localhost WebSocket connections in development
  const connectSrc = [...mergedConfig.connectSrc];
  if (isDevelopment) {
    // Add localhost connections for Next.js hot reload
    if (!connectSrc.some(src => src.includes('localhost'))) {
      connectSrc.push("ws://localhost:*", "http://localhost:*");
    }
  }

  // Build directive string
  const directives: string[] = [
    `default-src ${mergedConfig.defaultSrc.join(' ')}`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${mergedConfig.styleSrc.join(' ')}`,
    `img-src ${mergedConfig.imgSrc.join(' ')}`,
    `font-src ${mergedConfig.fontSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `media-src ${mergedConfig.mediaSrc.join(' ')}`,
    `object-src ${mergedConfig.objectSrc.join(' ')}`,
    `base-uri ${mergedConfig.baseUri.join(' ')}`,
    `form-action ${mergedConfig.formAction.join(' ')}`,
    `frame-ancestors ${mergedConfig.frameAncestors.join(' ')}`,
    `frame-src ${mergedConfig.frameSrc.join(' ')}`,
  ];

  // Add upgrade-insecure-requests directive if enabled
  if (mergedConfig.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  // Requirement 10.5: Add report-uri directive for CSP violation reporting
  // report-uri is the legacy directive, supported by all browsers
  if (mergedConfig.reportUri) {
    directives.push(`report-uri ${mergedConfig.reportUri}`);
  }

  // Requirement 10.5: Add report-to directive for modern browsers
  // report-to uses the Reporting API (requires separate Report-To header)
  // For now, we only include report-uri as it's widely supported
  // and doesn't require additional configuration
  if (mergedConfig.reportTo) {
    directives.push(`report-to ${mergedConfig.reportTo}`);
  }

  return directives.join('; ');
}

/**
 * Creates a CSP configuration for the current Node.js environment
 * 
 * Automatically detects NODE_ENV and returns appropriate configuration
 * 
 * @returns CSP directive string for current environment
 */
export function buildCSPForEnvironment(): string {
  const environment = process.env.NODE_ENV === 'development' ? 'development' : 'production';
  return buildCSPDirectives({ environment });
}


/**
 * Examples: Adding New Third-Party Integrations
 * 
 * To add a new third-party service to the CSP, update the DEFAULT_CSP_CONFIG
 * with the appropriate domains:
 * 
 * Example 1: Adding a new analytics service
 * ```typescript
 * scriptSrc: ["'self'", "'unsafe-inline'", "https://js.paystack.co", "https://analytics.example.com"],
 * connectSrc: ["'self'", "*.supabase.co", "https://api.paystack.co", "https://api.analytics.example.com"],
 * ```
 * 
 * Example 2: Adding a new image CDN
 * ```typescript
 * imgSrc: ["'self'", "data:", "blob:", "https:", "*.supabase.co", "res.cloudinary.com", "cdn.example.com"],
 * ```
 * 
 * Example 3: Adding a new video streaming service
 * ```typescript
 * mediaSrc: ["'self'", "blob:", "*.supabase.co", "stream.example.com"],
 * frameSrc: ["'self'", "https://js.paystack.co", "https://player.example.com"],
 * ```
 * 
 * After making changes:
 * 1. Update the tests in csp-builder.test.ts to verify the new domains
 * 2. Run `npm test lib/security/csp-builder.test.ts` to ensure tests pass
 * 3. Update docs/SECURITY.md with the new integration details
 * 4. Test in development to ensure resources load correctly
 * 5. Monitor browser console for CSP violations after deployment
 */
