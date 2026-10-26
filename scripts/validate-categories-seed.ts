import { categoriesSeed, expectedSubcategoryCounts, getTotalSubcategoryCount, validateCategorySeed } from '../data/categories-seed';

console.log('=== Category Seed Validation ===\n');

// Run validation
const validation = validateCategorySeed();
console.log('Validation Result:', validation.isValid ? '✓ VALID' : '✗ INVALID');
if (validation.errors.length > 0) {
  console.log('\nErrors:');
  validation.errors.forEach(error => console.log(`  - ${error}`));
}

// Check total counts
const totalSubcategories = getTotalSubcategoryCount();
console.log(`\nTotal main categories: ${categoriesSeed.length} (expected: 23)`);
console.log(`Total subcategories: ${totalSubcategories} (expected: 289)`);

// Check individual category counts
console.log('\n=== Subcategory Counts ===');
let mismatchFound = false;

categoriesSeed.forEach(category => {
  const actualCount = category.subcategories?.length || 0;
  const expectedCount = expectedSubcategoryCounts[category.name];
  const status = actualCount === expectedCount ? '✓' : '✗';
  
  if (actualCount !== expectedCount) {
    mismatchFound = true;
    console.log(`${status} ${category.name}: ${actualCount} (expected: ${expectedCount}) - MISMATCH`);
  } else {
    console.log(`${status} ${category.name}: ${actualCount}`);
  }
});

console.log('\n' + (mismatchFound ? '✗ Some categories have incorrect subcategory counts' : '✓ All category counts match'));
