/**
 * CSV Parser for Category Import
 * 
 * Parses CSV files containing category data and validates:
 * - Required fields (name, display_order)
 * - Parent ID references exist
 * - Display order uniqueness within parent
 * - Returns descriptive errors with line numbers
 * 
 * Requirements: 22.1, 22.2, 22.5, 22.6
 * 
 * IMPORTANT CONSTRAINT: Excludes multilingual translation features
 */

import type { Category } from '@/lib/types/category';

export interface ParsedCategory {
  name: string;
  parent_id?: string | null;
  display_order: number;
  description?: string;
  icon?: string;
}

export interface ParseError {
  line: number;
  error: string;
}

export interface ParseResult {
  success: boolean;
  categories: ParsedCategory[];
  errors: ParseError[];
}

/**
 * Parses CSV data into category objects with validation
 * 
 * CSV Format:
 * name,parent_id,display_order,description,icon
 * 
 * @param csvData - CSV string with headers
 * @returns ParseResult with categories and/or errors
 * 
 * Validates:
 * - Required fields: name, display_order
 * - Parent ID references exist (Requirement 22.5)
 * - Display order uniqueness within parent (Requirement 22.6)
 * - Returns descriptive errors with line numbers (Requirement 22.2)
 */
export function parseCSVToCategories(csvData: string): ParseResult {
  const errors: ParseError[] = [];
  const categories: ParsedCategory[] = [];
  
  // Split into lines and handle different line endings
  const lines = csvData.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return {
      success: false,
      categories: [],
      errors: [{ line: 0, error: 'CSV file is empty' }]
    };
  }
  
  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['name', 'display_order'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    return {
      success: false,
      categories: [],
      errors: [{
        line: 1,
        error: `Missing required headers: ${missingHeaders.join(', ')}`
      }]
    };
  }
  
  // Get header indices
  const nameIndex = headers.indexOf('name');
  const parentIdIndex = headers.indexOf('parent_id');
  const displayOrderIndex = headers.indexOf('display_order');
  const descriptionIndex = headers.indexOf('description');
  const iconIndex = headers.indexOf('icon');
  
  // Parse data lines
  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();
    
    if (!line) continue; // Skip empty lines
    
    // Parse CSV line (simple split, doesn't handle quotes with commas)
    const values = line.split(',').map(v => v.trim());
    
    // Validate field count
    if (values.length < requiredHeaders.length) {
      errors.push({
        line: lineNumber,
        error: `Insufficient fields: expected at least ${requiredHeaders.length}, got ${values.length}`
      });
      continue;
    }
    
    // Extract fields
    const name = values[nameIndex];
    const parentId = parentIdIndex >= 0 ? values[parentIdIndex] : undefined;
    const displayOrderStr = values[displayOrderIndex];
    const description = descriptionIndex >= 0 ? values[descriptionIndex] : undefined;
    const icon = iconIndex >= 0 ? values[iconIndex] : undefined;
    
    // Validate required fields
    if (!name) {
      errors.push({
        line: lineNumber,
        error: 'Missing required field: name'
      });
      continue;
    }
    
    if (!displayOrderStr) {
      errors.push({
        line: lineNumber,
        error: 'Missing required field: display_order'
      });
      continue;
    }
    
    // Validate display_order is a number
    const displayOrder = parseInt(displayOrderStr, 10);
    if (isNaN(displayOrder)) {
      errors.push({
        line: lineNumber,
        error: `Invalid display_order: "${displayOrderStr}" is not a valid number`
      });
      continue;
    }
    
    // Validate display_order is non-negative
    if (displayOrder < 0) {
      errors.push({
        line: lineNumber,
        error: `Invalid display_order: ${displayOrder} must be non-negative`
      });
      continue;
    }
    
    // Parse parent_id (empty string or null means top-level category)
    const parsedParentId = parentId && parentId !== '' && parentId.toLowerCase() !== 'null' 
      ? parentId 
      : null;
    
    // Add category to list
    categories.push({
      name,
      parent_id: parsedParentId,
      display_order: displayOrder,
      description: description || undefined,
      icon: icon || undefined
    });
  }
  
  // Validate parent_id references exist (Requirement 22.5)
  const categoryIds = new Set<string>();
  const categoryNames = new Set<string>();
  
  categories.forEach((cat, idx) => {
    // Track category names for reference validation
    categoryNames.add(cat.name);
    // For CSV imports, we use name as temporary ID for validation
    categoryIds.add(cat.name);
  });
  
  // Check parent references
  categories.forEach((cat, idx) => {
    const lineNumber = idx + 2; // +2 because line 1 is header and idx is 0-based
    
    if (cat.parent_id && !categoryNames.has(cat.parent_id)) {
      errors.push({
        line: lineNumber,
        error: `Invalid parent_id: "${cat.parent_id}" does not exist in the category list`
      });
    }
  });
  
  // Validate display_order uniqueness within parent (Requirement 22.6)
  const displayOrderByParent = new Map<string | null, Map<number, number[]>>();
  
  categories.forEach((cat, idx) => {
    const lineNumber = idx + 2;
    const parentKey = cat.parent_id || 'ROOT';
    
    if (!displayOrderByParent.has(parentKey)) {
      displayOrderByParent.set(parentKey, new Map());
    }
    
    const orderMap = displayOrderByParent.get(parentKey)!;
    if (!orderMap.has(cat.display_order)) {
      orderMap.set(cat.display_order, []);
    }
    
    orderMap.get(cat.display_order)!.push(lineNumber);
  });
  
  // Report duplicate display_order values
  displayOrderByParent.forEach((orderMap, parentKey) => {
    orderMap.forEach((lineNumbers, displayOrder) => {
      if (lineNumbers.length > 1) {
        const parentLabel = parentKey === 'ROOT' ? 'root level' : `parent "${parentKey}"`;
        errors.push({
          line: lineNumbers[0],
          error: `Duplicate display_order ${displayOrder} for ${parentLabel} (found on lines: ${lineNumbers.join(', ')})`
        });
      }
    });
  });
  
  return {
    success: errors.length === 0,
    categories: errors.length === 0 ? categories : [],
    errors
  };
}

/**
 * Validates category data structure without CSV parsing
 * Useful for testing and programmatic category creation
 * 
 * @param categories - Array of parsed categories
 * @returns ParseResult with validation errors
 */
export function validateCategories(categories: ParsedCategory[]): ParseResult {
  const errors: ParseError[] = [];
  
  // Build category name set for parent validation
  const categoryNames = new Set<string>(categories.map(c => c.name));
  
  // Validate each category
  categories.forEach((cat, idx) => {
    const lineNumber = idx + 1;
    
    // Check required fields
    if (!cat.name || cat.name.trim() === '') {
      errors.push({
        line: lineNumber,
        error: 'Missing required field: name'
      });
    }
    
    if (cat.display_order === undefined || cat.display_order === null) {
      errors.push({
        line: lineNumber,
        error: 'Missing required field: display_order'
      });
    } else if (cat.display_order < 0) {
      errors.push({
        line: lineNumber,
        error: `Invalid display_order: ${cat.display_order} must be non-negative`
      });
    }
    
    // Validate parent_id exists
    if (cat.parent_id && !categoryNames.has(cat.parent_id)) {
      errors.push({
        line: lineNumber,
        error: `Invalid parent_id: "${cat.parent_id}" does not exist in the category list`
      });
    }
  });
  
  // Validate display_order uniqueness within parent
  const displayOrderByParent = new Map<string | null, Map<number, number[]>>();
  
  categories.forEach((cat, idx) => {
    const lineNumber = idx + 1;
    const parentKey = cat.parent_id || null;
    
    if (!displayOrderByParent.has(parentKey)) {
      displayOrderByParent.set(parentKey, new Map());
    }
    
    const orderMap = displayOrderByParent.get(parentKey)!;
    if (!orderMap.has(cat.display_order)) {
      orderMap.set(cat.display_order, []);
    }
    
    orderMap.get(cat.display_order)!.push(lineNumber);
  });
  
  // Report duplicate display_order values
  displayOrderByParent.forEach((orderMap, parentKey) => {
    orderMap.forEach((lineNumbers, displayOrder) => {
      if (lineNumbers.length > 1) {
        const parentLabel = parentKey === null ? 'root level' : `parent "${parentKey}"`;
        errors.push({
          line: lineNumbers[0],
          error: `Duplicate display_order ${displayOrder} for ${parentLabel} (found at indices: ${lineNumbers.map(n => n - 1).join(', ')})`
        });
      }
    });
  });
  
  return {
    success: errors.length === 0,
    categories: errors.length === 0 ? categories : [],
    errors
  };
}
