/**
 * Bundle Size Analysis Script
 * 
 * Task 22.3: Analyze bundle size
 * 
 * This script:
 * 1. Runs the Next.js bundle analyzer
 * 2. Checks for code-split components (CategoryPreviewPopover)
 * 3. Identifies large dependencies
 * 4. Suggests optimizations
 */

import { spawn } from 'child_process';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { setTimeout } from 'timers/promises';

interface BundleStats {
  totalSize: number;
  mainBundleSize: number;
  chunkCount: number;
  largestChunks: Array<{ name: string; size: number }>;
  codeSplitComponents: string[];
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run bundle analyzer
 */
async function runBundleAnalyzer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Building project with bundle analyzer...\n');
    console.log('This may take several minutes...\n');
    
    const analyzer = spawn('npm', ['run', 'analyze'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ANALYZE: 'true',
      },
    });

    analyzer.on('close', (code) => {
      if (code === 0) {
        console.log('\n✓ Bundle analysis complete');
        resolve();
      } else {
        reject(new Error(`Bundle analyzer exited with code ${code}`));
      }
    });

    analyzer.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check for code-split components
 */
async function checkCodeSplitting(): Promise<{
  hasCategoryPreviewPopover: boolean;
  dynamicImports: string[];
}> {
  const componentsToCheck = [
    'components/features/category-preview-popover.tsx',
    'components/features/category-grid.tsx',
    'components/features/category-card.tsx',
  ];

  const dynamicImports: string[] = [];
  let hasCategoryPreviewPopover = false;

  for (const component of componentsToCheck) {
    const filePath = join(process.cwd(), component);
    if (await fileExists(filePath)) {
      const content = await readFile(filePath, 'utf-8');
      
      // Check for dynamic imports
      const hasDynamicImport = content.includes('dynamic(') || 
                               content.includes('React.lazy') ||
                               content.includes('import(');
      
      if (hasDynamicImport) {
        dynamicImports.push(component);
      }

      if (component.includes('category-preview-popover')) {
        hasCategoryPreviewPopover = true;
      }
    }
  }

  return {
    hasCategoryPreviewPopover,
    dynamicImports,
  };
}

/**
 * Check for common optimization issues
 */
async function checkOptimizations(): Promise<{
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check package.json for large dependencies
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check for known large libraries
    const largeDeps = [
      'moment', // Should use date-fns instead
      'lodash', // Should use lodash-es or individual imports
      'axios', // Native fetch is often sufficient
    ];

    for (const dep of largeDeps) {
      if (deps[dep]) {
        issues.push(`Large dependency found: ${dep}`);
        
        if (dep === 'moment') {
          suggestions.push('Consider replacing moment with date-fns (already installed) - ~67KB smaller');
        } else if (dep === 'lodash') {
          suggestions.push('Consider using lodash-es or import individual lodash functions');
        }
      }
    }

    // Check for barrel imports that could be optimized
    const componentsWithBarrelImports = [
      'components/features/category-grid.tsx',
      'components/features/category-card.tsx',
    ];

    for (const component of componentsWithBarrelImports) {
      const filePath = join(process.cwd(), component);
      if (await fileExists(filePath)) {
        const content = await readFile(filePath, 'utf-8');
        
        // Check for lucide-react barrel imports
        if (content.includes("from 'lucide-react'") && !content.includes("from 'lucide-react/dist/")) {
          suggestions.push(`${component}: Consider using specific lucide-react imports`);
        }
      }
    }
  }

  return { issues, suggestions };
}

/**
 * Analyze Next.js build output
 */
async function analyzeBuildOutput(): Promise<void> {
  const buildOutputPath = join(process.cwd(), '.next', 'build-manifest.json');
  
  if (!(await fileExists(buildOutputPath))) {
    console.log('⚠ Build manifest not found. Run build first.');
    return;
  }

  try {
    const manifest = JSON.parse(await readFile(buildOutputPath, 'utf-8'));
    
    console.log('\n📊 Build Output Analysis:\n');
    
    // Count pages
    const pages = Object.keys(manifest.pages || {});
    console.log(`Total Pages: ${pages.length}`);
    
    // Check for browse and category pages
    const browsePages = pages.filter(p => p.includes('/browse') || p.includes('/categories'));
    console.log(`Browse/Category Pages: ${browsePages.length}`);
    console.log('  Pages:', browsePages.join(', '));
    
  } catch (error) {
    console.log('⚠ Could not parse build manifest');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('📦 Bundle Size Analysis\n');
  console.log('=' .repeat(80));
  console.log('\nTask 22.3: Analyzing bundle size and optimization opportunities\n');

  try {
    // Step 1: Check code splitting
    console.log('Step 1: Checking code splitting...\n');
    const codeSplitting = await checkCodeSplitting();
    
    if (codeSplitting.hasCategoryPreviewPopover) {
      console.log('✓ CategoryPreviewPopover component found');
    } else {
      console.log('⚠ CategoryPreviewPopover component not found');
    }

    if (codeSplitting.dynamicImports.length > 0) {
      console.log(`✓ Found ${codeSplitting.dynamicImports.length} dynamically imported components:`);
      codeSplitting.dynamicImports.forEach(comp => {
        console.log(`  • ${comp}`);
      });
    } else {
      console.log('⚠ No dynamic imports found');
      console.log('  Suggestion: Consider code-splitting large components like CategoryPreviewPopover');
    }

    // Step 2: Check for optimization issues
    console.log('\nStep 2: Checking for optimization opportunities...\n');
    const { issues, suggestions } = await checkOptimizations();

    if (issues.length > 0) {
      console.log('⚠ Issues found:');
      issues.forEach(issue => console.log(`  • ${issue}`));
    } else {
      console.log('✓ No major dependency issues found');
    }

    if (suggestions.length > 0) {
      console.log('\n💡 Optimization suggestions:');
      suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
    }

    // Step 3: Run bundle analyzer
    console.log('\n' + '='.repeat(80));
    console.log('\nStep 3: Running bundle analyzer...\n');
    
    await runBundleAnalyzer();

    // Step 4: Analyze build output
    console.log('\n' + '='.repeat(80));
    console.log('\nStep 4: Analyzing build output...\n');
    
    await analyzeBuildOutput();

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Summary\n');
    console.log('Bundle analysis complete! Review the following:');
    console.log('\n1. Check the bundle analyzer report in your browser');
    console.log('   - Look for large chunks that could be split');
    console.log('   - Verify CategoryPreviewPopover is in a separate chunk');
    console.log('   - Check for duplicate dependencies');
    console.log('\n2. Verify code splitting:');
    if (codeSplitting.dynamicImports.length > 0) {
      console.log('   ✓ Dynamic imports are being used');
    } else {
      console.log('   ⚠ Consider adding dynamic imports for large components');
    }
    console.log('\n3. Review optimization suggestions above');
    console.log('\n✅ Task 22.3 analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
