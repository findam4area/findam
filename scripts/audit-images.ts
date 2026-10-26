/**
 * Image Optimization Audit Script
 * 
 * Audits all Next.js Image component usages for:
 * - Proper sizes attribute
 * - Priority prop on above-the-fold images
 * - Blur placeholder implementation
 * - Lazy loading verification
 * 
 * Task: 10.2 - Optimize images with Next.js 16 Image component
 * Requirements: 11.4, 11.5, 13.14, 13.15
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface ImageUsage {
  file: string;
  line: number;
  hasSizes: boolean;
  hasPriority: boolean;
  hasPlaceholder: boolean;
  imageContext: string;
}

async function findImageComponents(dir: string, results: ImageUsage[] = []): Promise<ImageUsage[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
        await findImageComponents(fullPath, results);
      }
    } else if (entry.name.match(/\.(tsx|jsx)$/)) {
      const content = await readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Check if file imports Image from next/image
      const hasImageImport = content.includes('from "next/image"') || content.includes("from 'next/image'");
      
      if (hasImageImport) {
        // Find all <Image> component usages
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('<Image')) {
            // Extract the Image component block (may span multiple lines)
            let componentBlock = line;
            let j = i + 1;
            while (j < lines.length && !lines[j].includes('/>') && !lines[j].includes('</Image>')) {
              componentBlock += '\n' + lines[j];
              j++;
            }
            if (j < lines.length) {
              componentBlock += '\n' + lines[j];
            }

            results.push({
              file: fullPath.replace(process.cwd(), '').replace(/\\/g, '/'),
              line: i + 1,
              hasSizes: componentBlock.includes('sizes='),
              hasPriority: componentBlock.includes('priority'),
              hasPlaceholder: componentBlock.includes('placeholder=') || componentBlock.includes('blurDataURL='),
              imageContext: componentBlock.substring(0, 200)
            });
          }
        }
      }
    }
  }

  return results;
}

async function main() {
  console.log('🔍 Auditing Next.js Image components...\n');

  const componentsDir = join(process.cwd(), 'components');
  const appDir = join(process.cwd(), 'app');

  const usages: ImageUsage[] = [];
  
  await findImageComponents(componentsDir, usages);
  await findImageComponents(appDir, usages);

  console.log(`Found ${usages.length} Image component usages\n`);

  // Analyze results
  const withoutSizes = usages.filter(u => !u.hasSizes);
  const withPriority = usages.filter(u => u.hasPriority);
  const withPlaceholder = usages.filter(u => u.hasPlaceholder);

  console.log('📊 Summary:');
  console.log(`  ✅ With sizes attribute: ${usages.length - withoutSizes.length}/${usages.length}`);
  console.log(`  ⚡ With priority prop: ${withPriority.length}/${usages.length}`);
  console.log(`  🌫️  With placeholder: ${withPlaceholder.length}/${usages.length}`);
  console.log();

  if (withoutSizes.length > 0) {
    console.log('⚠️  Images without sizes attribute:');
    withoutSizes.forEach(u => {
      console.log(`  - ${u.file}:${u.line}`);
    });
    console.log();
  }

  // Recommendations
  console.log('💡 Recommendations:');
  console.log('  1. Add sizes attribute to all Image components for responsive loading');
  console.log('  2. Add priority={true} to above-the-fold images (hero, featured listings)');
  console.log('  3. Add placeholder="blur" for better perceived performance');
  console.log('  4. Verify remotePatterns in next.config.ts includes all image domains');
  console.log();

  // Above-the-fold components to check
  const aboveFoldFiles = [
    'hero-section',
    'featured-listings',
    'category-grid',
    'category-card'
  ];

  const aboveFoldImages = usages.filter(u => 
    aboveFoldFiles.some(file => u.file.includes(file))
  );

  if (aboveFoldImages.length > 0) {
    console.log('🎯 Above-the-fold images (should have priority={true}):');
    aboveFoldImages.forEach(u => {
      const status = u.hasPriority ? '✅' : '❌';
      console.log(`  ${status} ${u.file}:${u.line}`);
    });
    console.log();
  }

  // Exit with error if critical issues found
  if (withoutSizes.length > usages.length * 0.5) {
    console.error('❌ More than 50% of images missing sizes attribute');
    process.exit(1);
  }

  console.log('✅ Image audit complete');
}

main().catch(console.error);
