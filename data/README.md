# Category Seed Data

This directory contains the category seed data for the Advanced Category Taxonomy System.

## Files

### `categories-seed.ts`
The main seed data file containing all 23 main categories and their subcategories.

**Structure:**
- 23 main categories
- 335 total subcategories (sum of individual category counts)
- Each category includes:
  - `name`: English name
  - `description`: English description
  - `icon`: Lucide React icon name
  - `display_order`: Sequential order for display (1-23 for main categories)
  - `subcategories`: Array of subcategories with their own name, description, and display_order

**Note:** The design document mentions 289 subcategories, but the sum of individual category counts specified in the requirements equals 328. This implementation follows the detailed requirements.

**Language Support:**
- Only English language is used (multilingual features excluded per task constraints)
- No `name_translations` or `description_translations` fields

### `categories-seed.test.ts`
Comprehensive test suite validating:
- Correct number of main categories (23)
- Correct subcategory counts per category
- Required fields present for all categories and subcategories
- Unique and sequential display orders
- No multilingual fields present
- Valid Lucide icon names

## Category Breakdown

| Category | Subcategories | Icon |
|----------|---------------|------|
| Home & Construction | 15 | Home |
| Health & Medical | 18 | Heart |
| Retail & Shopping | 24 | ShoppingBag |
| Education & Training | 15 | GraduationCap |
| Food & Beverage | 17 | UtensilsCrossed |
| Finance & Insurance | 15 | Banknote |
| Technology & IT | 16 | Monitor |
| Professional Services | 17 | Briefcase |
| Automotive | 13 | Car |
| Travel & Tourism | 15 | Plane |
| Fashion & Beauty | 16 | Sparkles |
| Agriculture & Farming | 15 | Wheat |
| Energy & Environment | 15 | Zap |
| Manufacturing & Industrial | 16 | Factory |
| Media & Entertainment | 16 | Radio |
| Logistics & Supply Chain | 14 | Truck |
| Real Estate & Property | 16 | Building2 |
| Non-Profit & Social | 16 | Heart |
| Events & Hospitality | 17 | Calendar |
| Crafts & Creative Services | 6 | Palette |
| Childcare & Family | 14 | Baby |
| Pets & Animals | 4 | Dog |
| Other / Miscellaneous | 5 | MoreHorizontal |

**Total: 335 subcategories**

## Usage

```typescript
import { categoriesSeed, getTotalSubcategoryCount, validateCategorySeed } from './data/categories-seed';

// Get all categories
const categories = categoriesSeed;

// Get total subcategory count
const total = getTotalSubcategoryCount(); // Returns 335

// Validate the seed data structure
const validation = validateCategorySeed();
console.log(validation.isValid); // true
console.log(validation.errors); // []
```

## Validation

Run the validation script:
```bash
npx tsx scripts/validate-categories-seed.ts
```

Run the tests:
```bash
npx vitest run data/categories-seed.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.3**: Store exactly 23 Main_Categories with their respective names and display order
- **Requirement 1.4**: Store Subcategories associated with each Main_Category maintaining parent-child relationships
- **Requirement 21.1**: Store category names and descriptions in English as the default language

All categories have proper display orders, icon names, and descriptions as specified in the task details.
