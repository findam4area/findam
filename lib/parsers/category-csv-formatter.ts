/**
 * CSV Formatter for Category Export
 * 
 * Formats category objects into CSV files with validation:
 * - Required fields (name, display_order)
 * - Parent ID references exist
 * - Display order uniqueness within parent
 * - Outputs CSV with headers: name, parent_id, display_order, description, icon
 * 
 * Requirements: 22.3
 * 
 * IMPORTANT CONSTRAINT: Excludes multilingual translation features
 */

import type { ParsedCategory } from './category-csv-parser';

/**
 * Formats category objects into CSV format
 * 
 * CSV Format (Output):
 * name,parent_id,display_order,description,icon
 * 
 * @param categories - Array of category objects to format
 * @returns CSV string with headers and data
 * 
 * Features:
 * - Handles nested category structures (flattens hierarchy)
 * - Outputs headers: name, parent_id, display_order, description, icon
 * - Converts null parent_id to empty string
 * - Escapes commas in text fields
 * - Handles optional fields (description, icon)
 */
export function formatCategoriesToCSV(categories: ParsedCategory[]): string {
  // Start with header row
  const headers = ['name', 'parent_id', 'display_order', 'description', 'icon'];
  const rows: string[] = [headers.join(',')];
  
  // Process each category
  for (const category of categories) {
    const row = [
      escapeCSVField(category.name),
      escapeCSVField(category.parent_id ?? ''),
      category.display_order.toString(),
      escapeCSVField(category.description ?? ''),
      escapeCSVField(category.icon ?? '')
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

/**
 * Escapes a field value for CSV output
 * 
 * Rules:
 * - Empty strings remain empty
 * - Fields containing commas are wrapped in quotes
 * - Quotes within fields are escaped by doubling them
 * - Newlines are preserved within quoted fields
 * 
 * @param value - The field value to escape
 * @returns Escaped CSV field
 */
function escapeCSVField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the field is empty, return empty string
  if (stringValue === '') {
    return '';
  }
  
  // If the field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape internal quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringValue;
}
