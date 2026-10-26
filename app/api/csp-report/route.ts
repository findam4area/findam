/**
 * CSP Violation Reporting Endpoint
 * 
 * Requirements Coverage:
 * - 10.5: CSP violation reporting and logging
 * 
 * This endpoint receives Content Security Policy (CSP) violation reports from browsers
 * and logs them to Sentry for monitoring and security analysis.
 * 
 * CSP violations indicate attempts to load resources that are blocked by the CSP policy,
 * which could be:
 * - Legitimate resources that need to be allowlisted
 * - XSS attack attempts
 * - Misconfigured third-party integrations
 * - Browser extensions interfering with the site
 * 
 * @route POST /api/csp-report
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * CSP Violation Report Structure
 * 
 * This is the format browsers send when a CSP violation occurs.
 * The report is wrapped in a "csp-report" object.
 */
interface CSPReport {
  'csp-report': {
    'document-uri': string;           // Page where violation occurred
    'referrer'?: string;              // Referrer of the page
    'violated-directive': string;     // Specific directive that was violated (e.g., "script-src")
    'effective-directive': string;    // Effective directive after fallbacks
    'original-policy': string;        // Full CSP policy string
    'disposition': string;            // "enforce" or "report"
    'blocked-uri': string;            // URI that was blocked
    'line-number'?: number;           // Line number in source file
    'column-number'?: number;         // Column number in source file
    'source-file'?: string;           // File where violation occurred
    'status-code': number;            // HTTP status code of the blocked resource
    'script-sample'?: string;         // Sample of the blocked inline script/style
  };
}

/**
 * POST /api/csp-report
 * 
 * Receives CSP violation reports from browsers and logs them to Sentry.
 * 
 * @param request - Next.js request object containing the CSP violation report
 * @returns 204 No Content - CSP reports expect no response body
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the CSP violation report from the request body
    const report: CSPReport = await request.json();
    const violation = report['csp-report'];

    // Skip obviously non-actionable violations
    // Filter out browser extension violations - these are user-side issues
    if (
      violation['blocked-uri'].includes('chrome-extension://') ||
      violation['blocked-uri'].includes('moz-extension://') ||
      violation['blocked-uri'].includes('safari-extension://')
    ) {
      // Return 204 without logging - browser extensions are expected
      return new NextResponse(null, { status: 204 });
    }

    // Filter out data URIs and blob URIs - these are usually legitimate
    // and often false positives from legitimate app functionality
    if (
      violation['blocked-uri'].startsWith('data:') ||
      violation['blocked-uri'].startsWith('blob:')
    ) {
      // Return 204 without logging - data/blob URIs are common and often acceptable
      return new NextResponse(null, { status: 204 });
    }

    // Log to Sentry as a warning (not an error) with structured data
    // CSP violations are informational and help identify:
    // 1. Resources that need to be allowlisted
    // 2. Potential XSS attack attempts
    // 3. Third-party integration issues
    Sentry.captureMessage('CSP Violation', {
      level: 'warning',  // Warning level, not error - these are informational
      
      // Tags for filtering and searching in Sentry dashboard
      tags: {
        csp_directive: violation['violated-directive'],
        blocked_uri: violation['blocked-uri'],
        source_file: violation['source-file'] || 'unknown',
        disposition: violation['disposition'],
      },
      
      // Full violation details in context for debugging
      contexts: {
        csp: {
          document_uri: violation['document-uri'],
          referrer: violation['referrer'] || 'none',
          violated_directive: violation['violated-directive'],
          effective_directive: violation['effective-directive'],
          original_policy: violation['original-policy'],
          disposition: violation['disposition'],
          blocked_uri: violation['blocked-uri'],
          source_file: violation['source-file'] || 'unknown',
          line_number: violation['line-number'] || null,
          column_number: violation['column-number'] || null,
          status_code: violation['status-code'],
          script_sample: violation['script-sample'] || null,
        },
      },
    });

    // Log to console in development for immediate visibility
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔒 CSP Violation:', {
        directive: violation['violated-directive'],
        blocked: violation['blocked-uri'],
        page: violation['document-uri'],
        source: violation['source-file'] || 'unknown',
      });
    }

    // Requirement 10.5: Return 204 No Content
    // CSP violation reports expect no response body
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Silently fail - CSP reporting should never break the application
    // If parsing fails or Sentry is unavailable, we just return 204
    console.error('Error processing CSP report:', error);
    
    // Still return 204 to prevent browser retries
    return new NextResponse(null, { status: 204 });
  }
}
