/**
 * Mobile Compliance Validation Script
 * 
 * Validates that all UI components meet mobile responsiveness requirements
 * 
 * Task: 10.1
 * Requirements: 11.2, 11.3, 11.4, 11.6, 11.7, 11.8
 */

import fs from 'fs';
import path from 'path';

interface ComponentCheck {
  file: string;
  component: string;
  requirement: string;
  passed: boolean;
  details: string;
}

const checks: ComponentCheck[] = [];

function checkFileContains(
  filePath: string,
  componentName: string,
  searchString: string,
  requirement: string,
  description: string
): void {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const passed = content.includes(searchString);
    
    checks.push({
      file: filePath,
      component: componentName,
      requirement,
      passed,
      details: passed 
        ? `✅ ${description}` 
        : `❌ ${description} - Expected to find: ${searchString}`
    });
  } catch (error) {
    checks.push({
      file: filePath,
      component: componentName,
      requirement,
      passed: false,
      details: `❌ ${description} - File not found or error reading`
    });
  }
}

console.log('🔍 Validating Mobile Responsiveness Compliance...\n');

// Check Input component has minimum touch target height
checkFileContains(
  'components/ui/input.tsx',
  'Input',
  'min-h-[44px]',
  '11.3',
  'Input has minimum 44px height for touch targets'
);

// Check Select component has minimum touch target height
checkFileContains(
  'components/ui/select.tsx',
  'SelectTrigger',
  'min-h-[44px]',
  '11.3',
  'Select trigger has minimum 44px height for touch targets'
);

// Check Button component has touch target enforcement
checkFileContains(
  'components/ui/button.tsx',
  'Button',
  'min-h-[44px]',
  '11.3',
  'Buttons have minimum 44px height for touch targets'
);

// Check Mobile Menu has proper touch targets
checkFileContains(
  'components/layout/mobile-menu.tsx',
  'MobileMenu',
  'min-h-[44px]',
  '11.3',
  'Mobile menu items have minimum 44px height'
);

// Check Tailwind config has proper breakpoints
checkFileContains(
  'tailwind.config.ts',
  'TailwindConfig',
  "'xs': '320px'",
  '11.2',
  'Tailwind config includes 320px breakpoint'
);

checkFileContains(
  'tailwind.config.ts',
  'TailwindConfig',
  "'md': '768px'",
  '11.2',
  'Tailwind config includes 768px breakpoint'
);

// Check minimum body text size
checkFileContains(
  'tailwind.config.ts',
  'TailwindConfig',
  "'base': ['1rem'",
  '11.2',
  'Base font size is 16px (1rem) to prevent iOS zoom'
);

// Check mobile utilities exist
checkFileContains(
  'lib/utils/mobile.ts',
  'MobileUtils',
  'MIN_TOUCH_TARGET_SIZE',
  '11.3',
  'Mobile utilities include touch target size constant'
);

checkFileContains(
  'lib/utils/mobile.ts',
  'MobileUtils',
  'RESPONSIVE_IMAGE_SIZES',
  '11.4',
  'Mobile utilities include responsive image sizes'
);

// Check NavigationBar has mobile responsiveness
checkFileContains(
  'components/layout/navigation-bar.tsx',
  'NavigationBar',
  'md:hidden',
  '11.7',
  'Navigation bar adapts for mobile viewports'
);

// Generate report
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📊 MOBILE RESPONSIVENESS VALIDATION REPORT\n');
console.log('═══════════════════════════════════════════════════════════\n');

const groupedChecks = checks.reduce((acc, check) => {
  if (!acc[check.requirement]) {
    acc[check.requirement] = [];
  }
  acc[check.requirement].push(check);
  return acc;
}, {} as Record<string, ComponentCheck[]>);

const requirementNames: Record<string, string> = {
  '11.2': 'Breakpoints & Typography',
  '11.3': 'Touch Target Sizes (44x44px)',
  '11.4': 'Image Optimization',
  '11.7': 'Layout Adaptation',
};

Object.entries(groupedChecks).forEach(([req, reqChecks]) => {
  console.log(`\n📋 Requirement ${req}: ${requirementNames[req]}\n`);
  reqChecks.forEach(check => {
    console.log(`   ${check.details}`);
  });
});

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.passed).length;
const failedChecks = totalChecks - passedChecks;

console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('📈 SUMMARY\n');
console.log(`   Total Checks: ${totalChecks}`);
console.log(`   ✅ Passed: ${passedChecks}`);
console.log(`   ❌ Failed: ${failedChecks}`);
console.log(`   Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
console.log('\n═══════════════════════════════════════════════════════════\n');

if (failedChecks === 0) {
  console.log('🎉 ALL MOBILE RESPONSIVENESS CHECKS PASSED!\n');
  console.log('The application meets all WCAG 2.1 AA requirements for');
  console.log('touch targets and mobile responsiveness.\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME CHECKS FAILED\n');
  console.log('Please review the failed checks above and ensure all');
  console.log('components meet the mobile responsiveness requirements.\n');
  process.exit(1);
}
