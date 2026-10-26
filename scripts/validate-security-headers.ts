/**
 * Security Headers Validation Script
 * 
 * Validates that security headers are correctly configured in all environments
 * Fetches headers from a test endpoint and validates their presence and values
 * 
 * Task: 12.1
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface HeaderCheck {
  header: string;
  requirement: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
}

interface CSPDirectives {
  [key: string]: string[];
}

interface JSONReport {
  url: string;
  environment: 'development' | 'production';
  timestamp: string;
  checks: HeaderCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    successRate: number;
  };
}

const checks: HeaderCheck[] = [];
let targetUrl = '';
let isProductionEnv = false;
let outputFormat: 'text' | 'json' = 'text';

/**
 * Parse Content-Security-Policy header into directives object
 */
function parseCSP(cspHeader: string): CSPDirectives {
  const directives: CSPDirectives = {};
  
  if (!cspHeader) return directives;
  
  const parts = cspHeader.split(';').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    const [directive, ...values] = part.split(/\s+/);
    if (directive) {
      directives[directive] = values;
    }
  }
  
  return directives;
}

/**
 * Parse Strict-Transport-Security header
 */
function parseHSTS(hstsHeader: string): { maxAge: number; includeSubDomains: boolean; preload: boolean } {
  const result = {
    maxAge: 0,
    includeSubDomains: false,
    preload: false
  };
  
  if (!hstsHeader) return result;
  
  const parts = hstsHeader.split(';').map(s => s.trim());
  
  for (const part of parts) {
    if (part.startsWith('max-age=')) {
      result.maxAge = parseInt(part.split('=')[1], 10) || 0;
    } else if (part === 'includeSubDomains') {
      result.includeSubDomains = true;
    } else if (part === 'preload') {
      result.preload = true;
    }
  }
  
  return result;
}

/**
 * Validate Content-Security-Policy directives
 */
function validateCSP(cspHeader: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!cspHeader) {
    errors.push('Content-Security-Policy header is missing');
    return { valid: false, errors, warnings };
  }
  
  const directives = parseCSP(cspHeader);
  
  // Check for required directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src'];
  for (const directive of requiredDirectives) {
    if (!directives[directive]) {
      errors.push(`Missing required CSP directive: ${directive}`);
    }
  }
  
  // Validate default-src includes 'self'
  if (directives['default-src'] && !directives['default-src'].includes("'self'")) {
    errors.push("default-src should include 'self'");
  }
  
  // Validate frame-ancestors is set to prevent clickjacking
  if (!directives['frame-ancestors']) {
    warnings.push("frame-ancestors directive not found - recommended to prevent clickjacking");
  } else if (!directives['frame-ancestors'].includes("'none'") && !directives['frame-ancestors'].includes("'self'")) {
    warnings.push("frame-ancestors should be 'none' or 'self' to prevent clickjacking");
  }
  
  // Validate object-src is restricted
  if (!directives['object-src']) {
    warnings.push("object-src directive not found - recommended to set to 'none'");
  } else if (!directives['object-src'].includes("'none'")) {
    warnings.push("object-src should be 'none' to block plugins");
  }
  
  // Check for unsafe directives
  if (directives['script-src'] && directives['script-src'].includes("'unsafe-eval'")) {
    warnings.push("script-src contains 'unsafe-eval' - this may be acceptable in development but should be removed in production");
  }
  
  // Check for upgrade-insecure-requests
  if (!directives['upgrade-insecure-requests']) {
    warnings.push("upgrade-insecure-requests directive not found - recommended for HTTPS enforcement");
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Strict-Transport-Security header
 */
function validateHSTS(hstsHeader: string, isProduction: boolean): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!hstsHeader) {
    if (isProduction) {
      errors.push('Strict-Transport-Security header is missing in production');
    } else {
      warnings.push('Strict-Transport-Security header is missing (acceptable in development)');
    }
    return { valid: !isProduction, errors, warnings };
  }
  
  const hsts = parseHSTS(hstsHeader);
  
  // Validate max-age is at least 1 year (31536000 seconds)
  const minMaxAge = 31536000;
  if (hsts.maxAge < minMaxAge) {
    warnings.push(`HSTS max-age is ${hsts.maxAge} seconds, recommended minimum is ${minMaxAge} seconds (1 year)`);
  }
  
  // Check for includeSubDomains
  if (!hsts.includeSubDomains) {
    warnings.push('HSTS includeSubDomains not set - recommended for comprehensive protection');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate X-Frame-Options header
 */
function validateXFrameOptions(xfoHeader: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!xfoHeader) {
    errors.push('X-Frame-Options header is missing');
    return { valid: false, errors, warnings };
  }
  
  const validValues = ['DENY', 'SAMEORIGIN'];
  if (!validValues.includes(xfoHeader.toUpperCase())) {
    errors.push(`X-Frame-Options has invalid value: ${xfoHeader}. Should be DENY or SAMEORIGIN`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate X-Content-Type-Options header
 */
function validateXContentTypeOptions(xctoHeader: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!xctoHeader) {
    errors.push('X-Content-Type-Options header is missing');
    return { valid: false, errors, warnings };
  }
  
  if (xctoHeader.toLowerCase() !== 'nosniff') {
    errors.push(`X-Content-Type-Options has invalid value: ${xctoHeader}. Should be nosniff`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Referrer-Policy header
 */
function validateReferrerPolicy(rpHeader: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!rpHeader) {
    warnings.push('Referrer-Policy header is missing - recommended for privacy');
    return { valid: true, errors, warnings };
  }
  
  const validPolicies = [
    'no-referrer',
    'no-referrer-when-downgrade',
    'origin',
    'origin-when-cross-origin',
    'same-origin',
    'strict-origin',
    'strict-origin-when-cross-origin',
    'unsafe-url'
  ];
  
  if (!validPolicies.includes(rpHeader.toLowerCase())) {
    errors.push(`Referrer-Policy has invalid value: ${rpHeader}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Permissions-Policy header
 */
function validatePermissionsPolicy(ppHeader: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!ppHeader) {
    warnings.push('Permissions-Policy header is missing - recommended to restrict sensitive features');
    return { valid: true, errors, warnings };
  }
  
  // Just check that it exists and has some content
  // Full validation would be complex due to various policy formats
  if (ppHeader.trim().length === 0) {
    errors.push('Permissions-Policy header is empty');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if X-Powered-By header is removed
 */
function validateXPoweredBy(xpbHeader: string | undefined): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (xpbHeader) {
    warnings.push(`X-Powered-By header is present: ${xpbHeader} - should be removed to prevent technology disclosure`);
  }
  
  return {
    valid: !xpbHeader,
    errors,
    warnings
  };
}

/**
 * Fetch headers from endpoint
 */
async function fetchHeaders(url: string): Promise<Record<string, string>> {
  try {
    if (outputFormat === 'text') {
      console.log(`🔍 Fetching headers from: ${url}\n`);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      // Don't follow redirects to check the initial response
      redirect: 'manual'
    });
    
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    return headers;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch headers: ${error.message}`);
    }
    throw new Error('Failed to fetch headers: Unknown error');
  }
}

/**
 * Main validation function
 */
async function validateSecurityHeaders(url: string, format: 'text' | 'json'): Promise<void> {
  targetUrl = url;
  outputFormat = format;
  
  if (format === 'text') {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔒 SECURITY HEADERS VALIDATION\n');
    console.log('═══════════════════════════════════════════════════════════\n');
  }
  
  try {
    // Fetch headers
    const headers = await fetchHeaders(url);
    
    // Determine if this is production based on URL or environment
    isProductionEnv = url.includes('://localhost') || url.includes('://127.0.0.1') ? false : true;
    
    if (format === 'text') {
      console.log(`📍 Environment: ${isProductionEnv ? 'Production' : 'Development'}\n`);
      console.log('───────────────────────────────────────────────────────────\n');
    }
    
    // Validate Content-Security-Policy
    const cspResult = validateCSP(headers['content-security-policy']);
    if (cspResult.valid) {
      checks.push({
        header: 'Content-Security-Policy',
        requirement: '10.2, 10.3',
        status: 'passed',
        details: 'CSP header is present with valid directives'
      });
    } else {
      checks.push({
        header: 'Content-Security-Policy',
        requirement: '10.2, 10.3',
        status: 'failed',
        details: `CSP validation failed: ${cspResult.errors.join(', ')}`
      });
    }
    
    // Add warnings as separate checks
    cspResult.warnings.forEach(warning => {
      checks.push({
        header: 'Content-Security-Policy',
        requirement: '10.2, 10.3',
        status: 'warning',
        details: warning
      });
    });
    
    // Validate HSTS
    const hstsResult = validateHSTS(headers['strict-transport-security'], isProductionEnv);
    if (hstsResult.valid) {
      checks.push({
        header: 'Strict-Transport-Security',
        requirement: '10.4',
        status: 'passed',
        details: 'HSTS header is properly configured'
      });
    } else {
      checks.push({
        header: 'Strict-Transport-Security',
        requirement: '10.4',
        status: 'failed',
        details: `HSTS validation failed: ${hstsResult.errors.join(', ')}`
      });
    }
    
    hstsResult.warnings.forEach(warning => {
      checks.push({
        header: 'Strict-Transport-Security',
        requirement: '10.4',
        status: 'warning',
        details: warning
      });
    });
    
    // Validate X-Frame-Options
    const xfoResult = validateXFrameOptions(headers['x-frame-options']);
    if (xfoResult.valid) {
      checks.push({
        header: 'X-Frame-Options',
        requirement: '10.2',
        status: 'passed',
        details: `X-Frame-Options is set to ${headers['x-frame-options']}`
      });
    } else {
      checks.push({
        header: 'X-Frame-Options',
        requirement: '10.2',
        status: 'failed',
        details: `X-Frame-Options validation failed: ${xfoResult.errors.join(', ')}`
      });
    }
    
    // Validate X-Content-Type-Options
    const xctoResult = validateXContentTypeOptions(headers['x-content-type-options']);
    if (xctoResult.valid) {
      checks.push({
        header: 'X-Content-Type-Options',
        requirement: '10.2',
        status: 'passed',
        details: 'X-Content-Type-Options is set to nosniff'
      });
    } else {
      checks.push({
        header: 'X-Content-Type-Options',
        requirement: '10.2',
        status: 'failed',
        details: `X-Content-Type-Options validation failed: ${xctoResult.errors.join(', ')}`
      });
    }
    
    // Validate Referrer-Policy
    const rpResult = validateReferrerPolicy(headers['referrer-policy']);
    if (rpResult.valid) {
      if (headers['referrer-policy']) {
        checks.push({
          header: 'Referrer-Policy',
          requirement: '10.2',
          status: 'passed',
          details: `Referrer-Policy is set to ${headers['referrer-policy']}`
        });
      }
    } else {
      checks.push({
        header: 'Referrer-Policy',
        requirement: '10.2',
        status: 'failed',
        details: `Referrer-Policy validation failed: ${rpResult.errors.join(', ')}`
      });
    }
    
    rpResult.warnings.forEach(warning => {
      checks.push({
        header: 'Referrer-Policy',
        requirement: '10.2',
        status: 'warning',
        details: warning
      });
    });
    
    // Validate Permissions-Policy
    const ppResult = validatePermissionsPolicy(headers['permissions-policy']);
    if (ppResult.valid) {
      if (headers['permissions-policy']) {
        checks.push({
          header: 'Permissions-Policy',
          requirement: '10.2',
          status: 'passed',
          details: 'Permissions-Policy header is present'
        });
      }
    } else {
      checks.push({
        header: 'Permissions-Policy',
        requirement: '10.2',
        status: 'failed',
        details: `Permissions-Policy validation failed: ${ppResult.errors.join(', ')}`
      });
    }
    
    ppResult.warnings.forEach(warning => {
      checks.push({
        header: 'Permissions-Policy',
        requirement: '10.2',
        status: 'warning',
        details: warning
      });
    });
    
    // Validate X-Powered-By is removed
    const xpbResult = validateXPoweredBy(headers['x-powered-by']);
    if (xpbResult.valid) {
      checks.push({
        header: 'X-Powered-By',
        requirement: '10.2',
        status: 'passed',
        details: 'X-Powered-By header is not present (technology disclosure prevented)'
      });
    }
    
    xpbResult.warnings.forEach(warning => {
      checks.push({
        header: 'X-Powered-By',
        requirement: '10.2',
        status: 'warning',
        details: warning
      });
    });
    
    // Generate report
    generateReport(format);
    
  } catch (error) {
    if (error instanceof Error) {
      if (format === 'json') {
        // Output error as JSON
        const errorReport: JSONReport = {
          url: targetUrl,
          environment: isProductionEnv ? 'production' : 'development',
          timestamp: new Date().toISOString(),
          checks: [],
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            successRate: 0
          }
        };
        console.error(JSON.stringify({
          error: error.message,
          report: errorReport
        }, null, 2));
      } else {
        console.error(`\n❌ Error: ${error.message}\n`);
        console.error('Please ensure the server is running and accessible.\n');
        console.error('To test locally, run: npm run dev\n');
        console.error('Then run this script again with: npm run validate:headers\n');
      }
    }
    process.exit(1);
  }
}

/**
 * Generate JSON report
 */
function generateJSONReport(): void {
  const passedChecks = checks.filter(c => c.status === 'passed').length;
  const failedChecks = checks.filter(c => c.status === 'failed').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const totalChecks = checks.length;
  
  const successRate = totalChecks > 0 
    ? parseFloat(((passedChecks / (passedChecks + failedChecks)) * 100).toFixed(1))
    : 0;
  
  const report: JSONReport = {
    url: targetUrl,
    environment: isProductionEnv ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    checks: checks,
    summary: {
      total: totalChecks,
      passed: passedChecks,
      failed: failedChecks,
      warnings: warningChecks,
      successRate: successRate
    }
  };
  
  console.log(JSON.stringify(report, null, 2));
  
  // Exit with appropriate code
  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

/**
 * Generate and display validation report
 */
function generateReport(format: 'text' | 'json'): void {
  if (format === 'json') {
    generateJSONReport();
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 SECURITY HEADERS VALIDATION REPORT\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Group checks by header
  const groupedChecks = checks.reduce((acc, check) => {
    if (!acc[check.header]) {
      acc[check.header] = [];
    }
    acc[check.header].push(check);
    return acc;
  }, {} as Record<string, HeaderCheck[]>);
  
  // Display checks grouped by header
  Object.entries(groupedChecks).forEach(([header, headerChecks]) => {
    console.log(`\n🔐 ${header} (Requirement ${headerChecks[0].requirement})\n`);
    
    headerChecks.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : check.status === 'failed' ? '❌' : '⚠️';
      console.log(`   ${icon} ${check.details}`);
    });
  });
  
  // Calculate summary
  const passedChecks = checks.filter(c => c.status === 'passed').length;
  const failedChecks = checks.filter(c => c.status === 'failed').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const totalChecks = checks.length;
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📈 SUMMARY\n');
  console.log(`   Total Checks: ${totalChecks}`);
  console.log(`   ✅ Passed: ${passedChecks}`);
  console.log(`   ❌ Failed: ${failedChecks}`);
  console.log(`   ⚠️  Warnings: ${warningChecks}`);
  
  if (totalChecks > 0) {
    const successRate = ((passedChecks / (passedChecks + failedChecks)) * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  if (failedChecks === 0) {
    console.log('🎉 ALL CRITICAL SECURITY HEADER CHECKS PASSED!\n');
    if (warningChecks > 0) {
      console.log(`⚠️  There are ${warningChecks} warning(s) that should be reviewed.\n`);
    } else {
      console.log('The application has comprehensive security header protection.\n');
    }
    process.exit(0);
  } else {
    console.log('⚠️  SOME CRITICAL CHECKS FAILED\n');
    console.log('Please review the failed checks above and ensure all required');
    console.log('security headers are properly configured.\n');
    process.exit(1);
  }
}

// Main execution
// Parse command line arguments
const args = process.argv.slice(2);
let url = 'http://localhost:3000';
let format: 'text' | 'json' = 'text';

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Security Headers Validation Script

Usage:
  npm run validate:headers [URL]
  npm run validate:headers:json [URL]
  npx tsx scripts/validate-security-headers.ts [URL] [--format <text|json>]

Options:
  --format <format>   Output format: 'text' (default) or 'json'
  --help, -h          Show this help message

Examples:
  # Validate local development server (text format)
  npm run validate:headers

  # Validate local development server (JSON format)
  npm run validate:headers:json

  # Validate custom URL with text format
  npm run validate:headers -- https://staging.example.com

  # Validate custom URL with JSON format
  npx tsx scripts/validate-security-headers.ts https://example.com --format json

  # Save JSON output to file
  npm run validate:headers:json > security-report.json
`);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--format' && args[i + 1]) {
    const formatValue = args[i + 1];
    if (formatValue === 'json' || formatValue === 'text') {
      format = formatValue;
    } else {
      console.error(`Invalid format: ${formatValue}. Use 'text' or 'json'.`);
      process.exit(1);
    }
    i++; // Skip the next argument since we've processed it
  } else if (!arg.startsWith('--')) {
    // Assume it's the URL
    url = arg;
  }
}

validateSecurityHeaders(url, format).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
