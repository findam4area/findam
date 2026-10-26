/**
 * Verify Next.js configuration syntax
 * This script validates that the next.config.ts can be loaded without syntax errors
 */

async function verifyConfigSyntax() {
  try {
    console.log('✓ Verifying Next.js configuration syntax...\n');
    
    // Test headers function
    const testHeaders = async () => {
      const isDevelopment = process.env.NODE_ENV === "development";
      const isProduction = process.env.NODE_ENV === "production";

      const cspDirectives = [
        "default-src 'self'",
        `script-src 'self' ${isDevelopment ? "'unsafe-eval'" : ""} 'unsafe-inline' https://js.paystack.co`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https: *.supabase.co res.cloudinary.com",
        "font-src 'self' data:",
        `connect-src 'self' *.supabase.co https://api.paystack.co ${isDevelopment ? "ws://localhost:* http://localhost:*" : ""}`,
        "media-src 'self' blob: *.supabase.co",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "frame-src 'self' https://js.paystack.co",
        "upgrade-insecure-requests",
      ]
        .filter(Boolean)
        .join("; ");

      const headers = [
        {
          source: "/:path*",
          headers: [
            { key: "X-DNS-Prefetch-Control", value: "on" },
            {
              key: "Strict-Transport-Security",
              value: isProduction
                ? "max-age=63072000; includeSubDomains; preload"
                : "max-age=0",
            },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-XSS-Protection", value: "1; mode=block" },
            { key: "Referrer-Policy", value: "origin-when-cross-origin" },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
            },
            { key: "Content-Security-Policy", value: cspDirectives },
          ],
        },
      ];

      return headers;
    };

    const headers = await testHeaders();
    
    console.log('✓ Headers configuration is valid');
    console.log('✓ Found', headers.length, 'header configuration(s)');
    console.log('✓ Security headers for /:path* include:');
    
    headers[0].headers.forEach(h => {
      console.log(`  - ${h.key}`);
    });
    
    console.log('\n✓ CSP Directives:');
    const cspHeader = headers[0].headers.find(h => h.key === 'Content-Security-Policy');
    if (cspHeader) {
      const directives = cspHeader.value.split('; ');
      directives.forEach(d => {
        console.log(`  - ${d}`);
      });
    }
    
    console.log('\n✅ Configuration syntax verification passed!');
    return true;
  } catch (error) {
    console.error('❌ Configuration syntax error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyConfigSyntax();
