/**
 * Bundle Size Analysis Script
 * 
 * Analyzes the production build bundle size using @next/bundle-analyzer
 * 
 * Task: 10.15 - Performance optimization and Lighthouse audit
 * Requirements: 11.5, 11.8
 * 
 * Usage:
 *   npm run analyze
 * 
 * This will:
 * 1. Build the production bundle with ANALYZE=true
 * 2. Open the bundle analyzer in the browser
 * 3. Show breakdown of bundle sizes by route and package
 */

import { execSync } from 'child_process';

console.log('🔍 Analyzing production bundle size...\n');

try {
  // Run production build with bundle analyzer enabled
  console.log('Building production bundle with analyzer...');
  
  // Set environment variable and run build
  process.env.ANALYZE = 'true';
  execSync('npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      ANALYZE: 'true',
    },
  });

  console.log('\n✅ Bundle analysis complete!');
  console.log('📊 The bundle analyzer should have opened in your browser.');
  console.log('\n💡 Tips for reducing bundle size:');
  console.log('   - Look for large packages that can be replaced with smaller alternatives');
  console.log('   - Check for duplicate dependencies');
  console.log('   - Ensure tree-shaking is working (unused code should not be included)');
  console.log('   - Consider code splitting for large components');
  console.log('   - Use dynamic imports for non-critical code');
} catch (error) {
  console.error('❌ Error analyzing bundle:', error);
  process.exit(1);
}
