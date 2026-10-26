/**
 * Example usage of CSV Category Formatter
 * 
 * This file demonstrates how to use the formatCategoriesToCSV function
 * to export category data to CSV format.
 */

import { formatCategoriesToCSV } from './category-csv-formatter';
import type { ParsedCategory } from './category-csv-parser';

// Example 1: Format main categories
const mainCategories: ParsedCategory[] = [
  {
    name: 'Home & Construction',
    parent_id: null,
    display_order: 1,
    description: 'Professional home improvement services',
    icon: 'Home'
  },
  {
    name: 'Health & Medical',
    parent_id: null,
    display_order: 2,
    description: 'Healthcare services and providers',
    icon: 'Heart'
  }
];

const csvOutput1 = formatCategoriesToCSV(mainCategories);
console.log('Example 1 - Main Categories:');
console.log(csvOutput1);
console.log();

// Example 2: Format categories with subcategories (nested structure)
const nestedCategories: ParsedCategory[] = [
  {
    name: 'Electronics',
    parent_id: null,
    display_order: 1,
    description: 'Electronic devices and gadgets',
    icon: 'Laptop'
  },
  {
    name: 'Smartphones',
    parent_id: 'Electronics',
    display_order: 1,
    description: 'Mobile phones and smartphones'
  },
  {
    name: 'Laptops',
    parent_id: 'Electronics',
    display_order: 2,
    description: 'Portable computers'
  },
  {
    name: 'Tablets',
    parent_id: 'Electronics',
    display_order: 3,
    description: 'Tablet computers'
  }
];

const csvOutput2 = formatCategoriesToCSV(nestedCategories);
console.log('Example 2 - Nested Categories:');
console.log(csvOutput2);
console.log();

// Example 3: Format categories with minimal fields
const minimalCategories: ParsedCategory[] = [
  {
    name: 'Test Category',
    parent_id: null,
    display_order: 1
  }
];

const csvOutput3 = formatCategoriesToCSV(minimalCategories);
console.log('Example 3 - Minimal Fields:');
console.log(csvOutput3);
console.log();

// Example 4: Handle special characters
const specialCategories: ParsedCategory[] = [
  {
    name: 'Food & Beverage',
    parent_id: null,
    display_order: 1,
    description: 'Restaurants and cafes',
    icon: 'Utensils'
  }
];

const csvOutput4 = formatCategoriesToCSV(specialCategories);
console.log('Example 4 - Special Characters:');
console.log(csvOutput4);
