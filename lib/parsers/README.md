# Category CSV Parser

A robust CSV parser for importing category taxonomy data with comprehensive validation.

## Features

- **CSV Parsing**: Converts CSV data into structured category objects
- **Parent Reference Validation**: Ensures all parent_id references exist in the category list (Requirement 22.5)
- **Display Order Uniqueness**: Validates display_order is unique within each parent category (Requirement 22.6)
- **Descriptive Error Messages**: Returns errors with specific line numbers and detailed descriptions (Requirement 22.2)
- **Flexible Input**: Handles various null representations for root-level categories
- **Empty Line Handling**: Automatically skips empty lines in CSV files

## Usage

### Basic Parsing

```typescript
import { parseCSVToCategories } from '@/lib/parsers';

const csvData = `name,parent_id,display_order,description,icon
Home & Construction,,1,Professional home improvement services,Home
Health & Medical,,2,Healthcare services and providers,Heart`;

const result = parseCSVToCategories(csvData);

if (result.success) {
  console.log(`Parsed ${result.categories.length} categories`);
  result.categories.forEach(cat => {
    console.log(cat.name, cat.display_order);
  });
} else {
  console.error('Parsing errors:', result.errors);
}
```

### Error Handling

```typescript
const result = parseCSVToCategories(csvData);

if (!result.success) {
  result.errors.forEach(error => {
    console.error(`Line ${error.line}: ${error.error}`);
  });
}
```

### Programmatic Validation

For validating categories that are created programmatically (not from CSV):

```typescript
import { validateCategories } from '@/lib/parsers';

const categories = [
  { name: 'Category1', parent_id: null, display_order: 1, description: 'Test' },
  { name: 'Category2', parent_id: 'Category1', display_order: 1, description: 'Test' }
];

const result = validateCategories(categories);
```

## CSV Format

### Required Headers
- `name` - Category name (required)
- `display_order` - Integer display order (required, must be non-negative)

### Optional Headers
- `parent_id` - Parent category name (empty, null, or NULL for root-level categories)
- `description` - Category description
- `icon` - Icon name

### Example CSV

```csv
name,parent_id,display_order,description,icon
Home & Construction,,1,Professional home improvement services,Home
Plumbing,Home & Construction,1,Pipe installation and repair,
Electrical,Home & Construction,2,Wiring and electrical systems,
Health & Medical,,2,Healthcare services,Heart
Hospitals,Health & Medical,1,Hospital services,
```

## Validation Rules

### 1. Required Fields
- **name**: Must be non-empty
- **display_order**: Must be a valid non-negative integer

### 2. Parent ID Validation (Requirement 22.5)
- Parent IDs must reference existing categories in the CSV
- Empty, "null", or "NULL" values are treated as root-level categories
- Invalid parent references will generate errors with line numbers

### 3. Display Order Uniqueness (Requirement 22.6)
- Display order must be unique within each parent category
- Root-level categories must have unique display orders
- Subcategories of different parents can have the same display order

### 4. Data Type Validation
- `display_order` must be a valid integer
- Negative display orders are rejected

## Error Messages

The parser provides detailed error messages with line numbers:

```typescript
{
  line: 5,
  error: "Invalid parent_id: 'NonExistent' does not exist in the category list"
}
```

```typescript
{
  line: 3,
  error: "Duplicate display_order 1 for root level (found on lines: 2, 3)"
}
```

```typescript
{
  line: 4,
  error: "Invalid display_order: 'abc' is not a valid number"
}
```

## API Reference

### `parseCSVToCategories(csvData: string): ParseResult`

Parses CSV data into category objects with validation.

**Parameters:**
- `csvData` (string): CSV content with headers

**Returns:** `ParseResult`
- `success` (boolean): Whether parsing succeeded
- `categories` (ParsedCategory[]): Array of parsed categories (empty if errors exist)
- `errors` (ParseError[]): Array of validation errors with line numbers

### `validateCategories(categories: ParsedCategory[]): ParseResult`

Validates programmatically created category arrays.

**Parameters:**
- `categories` (ParsedCategory[]): Array of category objects to validate

**Returns:** `ParseResult` (same structure as `parseCSVToCategories`)

## Types

### `ParsedCategory`
```typescript
interface ParsedCategory {
  name: string;
  parent_id?: string | null;
  display_order: number;
  description?: string;
  icon?: string;
}
```

### `ParseError`
```typescript
interface ParseError {
  line: number;
  error: string;
}
```

### `ParseResult`
```typescript
interface ParseResult {
  success: boolean;
  categories: ParsedCategory[];
  errors: ParseError[];
}
```

## Requirements Coverage

This parser implements the following requirements from the Advanced Category Taxonomy specification:

- **Requirement 22.1**: Parse CSV data into category objects with required fields
- **Requirement 22.2**: Return descriptive error messages with line numbers for invalid data
- **Requirement 22.5**: Validate parent_id references exist for all subcategories
- **Requirement 22.6**: Validate display_order values are unique within each parent category

## Testing

Run the test suite:

```bash
npm test -- lib/parsers/category-csv-parser.test.ts
```

Run the integration test:

```bash
npx tsx lib/parsers/integration-test.ts
```

## Limitations

- **CSV Parsing**: Uses simple comma-split parsing. Does not handle escaped commas within quoted fields.
- **Line Endings**: Handles both CRLF (`\r\n`) and LF (`\n`) line endings.
- **Encoding**: Expects UTF-8 encoded CSV files.
- **Multilingual Support**: Translation fields are not included per project constraints.

## Future Enhancements

Potential improvements for future versions:

1. Support for CSV files with escaped commas in quoted fields
2. Batch size limits for large CSV imports
3. Progress callbacks for large file processing
4. CSV dialect detection (delimiter, quote character)
5. Stream-based parsing for very large files
