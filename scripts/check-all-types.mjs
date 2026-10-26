/**
 * Script to check TypeScript errors across the codebase
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔍 Checking TypeScript errors across the codebase...\n');

try {
  // Run TypeScript compiler in no-emit mode
  execSync('npx tsc --noEmit --pretty false', {
    encoding: 'utf-8',
    stdio: 'pipe',
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  });
  
  console.log('✅ No TypeScript errors found!');
  process.exit(0);
} catch (error) {
  const output = error.stdout || error.stderr || '';
  
  // Parse errors
  const errorLines = output.split('\n').filter(line => line.includes('error TS'));
  const errorCount = errorLines.length;
  
  console.log(`❌ Found ${errorCount} TypeScript errors\n`);
  
  // Group errors by file
  const errorsByFile = {};
  let currentFile = '';
  
  output.split('\n').forEach(line => {
    if (line.includes('.ts') && line.includes(':')) {
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\):/);
      if (match) {
        currentFile = match[1];
        if (!errorsByFile[currentFile]) {
          errorsByFile[currentFile] = [];
        }
        errorsByFile[currentFile].push(line);
      }
    }
  });
  
  // Display summary
  console.log('📊 Errors by file:\n');
  Object.entries(errorsByFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .forEach(([file, errors]) => {
      const shortFile = file.replace(/^.*\\findam4area\\/, '');
      console.log(`  ${shortFile}: ${errors.length} errors`);
    });
  
  // Save full report
  const reportPath = 'typescript-errors-report.txt';
  writeFileSync(reportPath, output);
  console.log(`\n📝 Full report saved to: ${reportPath}`);
  
  process.exit(1);
}
