/**
 * Unit tests for CSV Category Parser
 * 
 * Tests Requirements:
 * - 22.1: Parse CSV to category objects
 * - 22.2: Return descriptive errors with line numbers
 * - 22.5: Validate parent_id references exist
 * - 22.6: Validate display_order uniqueness within parent
 */

import { describe, it, expect } from 'vitest';
import { parseCSVToCategories, validateCategories } from './category-csv-parser';

describe('parseCSVToCategories', () => {
  describe('valid CSV parsing', () => {
    it('should parse valid CSV with main categories', () => {
      const csv = `name,parent_id,display_order,description,icon
Home & Construction,,1,Professional home improvement services,Home
Health & Medical,,2,Healthcare services and providers,Heart
Retail & Shopping,,3,Stores and retail businesses,ShoppingBag`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.categories).toHaveLength(3);
      
      expect(result.categories[0]).toEqual({
        name: 'Home & Construction',
        parent_id: null,
        display_order: 1,
        description: 'Professional home improvement services',
        icon: 'Home'
      });
    });

    it('should parse valid CSV with subcategories', () => {
      const csv = `name,parent_id,display_order,description,icon
Home & Construction,,1,Professional home improvement services,Home
Plumbing,Home & Construction,1,Pipe installation and repair,
Electrical,Home & Construction,2,Wiring and electrical systems,`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.categories).toHaveLength(3);
      
      expect(result.categories[1]).toEqual({
        name: 'Plumbing',
        parent_id: 'Home & Construction',
        display_order: 1,
        description: 'Pipe installation and repair'
      });
    });

    it('should handle optional fields (description, icon)', () => {
      const csv = `name,parent_id,display_order,description,icon
Test Category,,1,,`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.categories[0].description).toBeUndefined();
      expect(result.categories[0].icon).toBeUndefined();
    });

    it('should handle null parent_id variations (empty, null string)', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1
Category2,null,2,Test,Icon2
Category3,NULL,3,Test,Icon3`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.categories).toHaveLength(3);
      expect(result.categories[0].parent_id).toBeNull();
      expect(result.categories[1].parent_id).toBeNull();
      expect(result.categories[2].parent_id).toBeNull();
    });

    it('should skip empty lines', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1

Category2,,2,Test,Icon2

`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.categories).toHaveLength(2);
    });
  });

  describe('error handling - missing headers', () => {
    it('should return error if CSV is empty', () => {
      const csv = '';

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        line: 0,
        error: 'CSV file is empty'
      });
    });

    it('should return error if required headers are missing', () => {
      const csv = `name,description,icon`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(1);
      expect(result.errors[0].error).toContain('Missing required headers');
      expect(result.errors[0].error).toContain('display_order');
    });
  });

  describe('error handling - required fields (Requirement 22.2)', () => {
    it('should return error with line number for missing name', () => {
      const csv = `name,parent_id,display_order,description,icon
,null,1,Description,Icon`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        line: 2,
        error: 'Missing required field: name'
      });
    });

    it('should return error with line number for missing display_order', () => {
      const csv = `name,parent_id,display_order,description,icon
Test Category,null,,Description,Icon`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        line: 2,
        error: 'Missing required field: display_order'
      });
    });

    it('should return error for invalid display_order (not a number)', () => {
      const csv = `name,parent_id,display_order,description,icon
Test Category,null,abc,Description,Icon`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(2);
      expect(result.errors[0].error).toContain('Invalid display_order');
      expect(result.errors[0].error).toContain('not a valid number');
    });

    it('should return error for negative display_order', () => {
      const csv = `name,parent_id,display_order,description,icon
Test Category,null,-1,Description,Icon`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(2);
      expect(result.errors[0].error).toContain('must be non-negative');
    });

    it('should return error for insufficient fields', () => {
      const csv = `name,parent_id,display_order,description,icon
Test`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(2);
      expect(result.errors[0].error).toContain('Insufficient fields');
    });
  });

  describe('parent_id validation (Requirement 22.5)', () => {
    it('should return error if parent_id does not exist', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1
Category2,NonExistentParent,1,Test,Icon2`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(3);
      expect(result.errors[0].error).toContain('Invalid parent_id');
      expect(result.errors[0].error).toContain('NonExistentParent');
      expect(result.errors[0].error).toContain('does not exist');
    });

    it('should allow parent_id that exists in the list', () => {
      const csv = `name,parent_id,display_order,description,icon
MainCategory,,1,Test,Icon1
SubCategory,MainCategory,1,Test,Icon2`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple invalid parent_id references', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1
Category2,Invalid1,1,Test,Icon2
Category3,Invalid2,2,Test,Icon3`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].error).toContain('Invalid1');
      expect(result.errors[1].error).toContain('Invalid2');
    });
  });

  describe('display_order uniqueness validation (Requirement 22.6)', () => {
    it('should return error for duplicate display_order at root level', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1
Category2,,1,Test,Icon2`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Duplicate display_order');
      expect(result.errors[0].error).toContain('root level');
      expect(result.errors[0].error).toContain('2, 3');
    });

    it('should return error for duplicate display_order within same parent', () => {
      const csv = `name,parent_id,display_order,description,icon
MainCategory,,1,Test,Icon1
SubCategory1,MainCategory,1,Test,Icon2
SubCategory2,MainCategory,1,Test,Icon3`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Duplicate display_order');
      expect(result.errors[0].error).toContain('MainCategory');
      expect(result.errors[0].error).toContain('3, 4');
    });

    it('should allow same display_order for different parents', () => {
      const csv = `name,parent_id,display_order,description,icon
MainCategory1,,1,Test,Icon1
MainCategory2,,2,Test,Icon2
SubCategory1,MainCategory1,1,Test,Icon3
SubCategory2,MainCategory2,1,Test,Icon4`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report multiple duplicate display_order errors', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1
Category2,,1,Test,Icon2
Category3,,2,Test,Icon3
Category4,,2,Test,Icon4`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('combined validation errors', () => {
    it('should report multiple types of errors with correct line numbers', () => {
      const csv = `name,parent_id,display_order,description,icon
Category1,,1,Test,Icon1
,null,2,Test,Icon2
Category3,InvalidParent,3,Test,Icon3
Category4,,abc,Test,Icon4
Category5,,1,Test,Icon5`;

      const result = parseCSVToCategories(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that errors are associated with correct line numbers
      const errorLines = result.errors.map(e => e.line);
      expect(errorLines).toContain(3); // Missing name - line 3
      // Note: Invalid parent error appears for line 4 which is checked during parent validation
      const hasInvalidParentError = result.errors.some(e => 
        e.error.includes('InvalidParent') && e.error.includes('Invalid parent_id')
      );
      expect(hasInvalidParentError).toBe(true);
      
      expect(errorLines).toContain(5); // Invalid display_order - line 5
      expect(errorLines).toContain(2); // Duplicate display_order with line 6
    });
  });
});

describe('validateCategories', () => {
  it('should validate programmatically created categories', () => {
    const categories = [
      { name: 'Category1', parent_id: null, display_order: 1, description: 'Test' },
      { name: 'Category2', parent_id: 'Category1', display_order: 1, description: 'Test' }
    ];

    const result = validateCategories(categories);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const categories = [
      { name: '', parent_id: null, display_order: 1 },
      { name: 'Category2', parent_id: null, display_order: -1 }
    ];

    const result = validateCategories(categories);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect invalid parent references', () => {
    const categories = [
      { name: 'Category1', parent_id: null, display_order: 1 },
      { name: 'Category2', parent_id: 'NonExistent', display_order: 1 }
    ];

    const result = validateCategories(categories);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Invalid parent_id');
  });

  it('should detect duplicate display_order within parent', () => {
    const categories = [
      { name: 'Main', parent_id: null, display_order: 1 },
      { name: 'Sub1', parent_id: 'Main', display_order: 1 },
      { name: 'Sub2', parent_id: 'Main', display_order: 1 }
    ];

    const result = validateCategories(categories);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Duplicate display_order');
  });
});
