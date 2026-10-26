# Category Components

This directory contains all category-related UI components for the FindAm platform.

## Components

### CategoryGrid

Displays all categories in a responsive grid layout with neon-styled cards and glassmorphism effects.

**Features:**

- Neon-styled category cards with glassmorphism
- Hover animations with 3D tilt effect using Framer Motion
- Click to select or navigate to category
- Responsive grid layout (2-5 columns based on screen size)
- Lucide React icons with neon glow effects

**Usage:**

```tsx
import { CategoryGrid } from "@/components/categories/category-grid";

<CategoryGrid
  categories={categories}
  onCategorySelect={(category) => console.log(category)}
/>;
```

**Props:**

- `categories`: Array of Category objects with id, name, icon, display_order
- `onCategorySelect?`: Optional callback when a category is clicked (if not provided, renders as link)

---

### SubcategorySelector

Displays subcategories for a selected category with animated selection and neon highlights.

**Features:**

- Fetches subcategories based on parent category
- Animated selection with neon highlights
- Validates subcategory belongs to parent category
- Loading and error states
- Responsive chip layout

**Usage:**

```tsx
import { SubcategorySelector } from "@/components/categories/subcategory-selector";

<SubcategorySelector
  categoryId={selectedCategoryId}
  selectedSubcategoryId={selectedSubcategoryId}
  onSubcategorySelect={(subcategory) => setSelectedSubcategory(subcategory)}
/>;
```

**Props:**

- `categoryId`: UUID of the parent category
- `selectedSubcategoryId?`: Currently selected subcategory ID
- `onSubcategorySelect`: Callback when a subcategory is selected
- `className?`: Optional additional CSS classes

---

### CategoryBreadcrumbs

Displays navigation breadcrumbs for category hierarchy (Home > Category > Subcategory).

**Features:**

- Shows Home > Category > Subcategory path
- Clickable links for navigation
- Neon-styled separators
- Responsive design
- Animated entrance with Framer Motion

**Usage:**

```tsx
import { CategoryBreadcrumbs } from "@/components/categories/category-breadcrumbs";

<CategoryBreadcrumbs
  category={category}
  subcategory={subcategory}
  showHome={true}
/>;
```

**Props:**

- `category?`: Category object with id, name, icon
- `subcategory?`: Subcategory object with id, name
- `showHome?`: Whether to show Home link (default: true)
- `className?`: Optional additional CSS classes

**Compact Version:**

```tsx
import { CategoryBreadcrumbsCompact } from "@/components/categories/category-breadcrumbs";

<CategoryBreadcrumbsCompact category={category} subcategory={subcategory} />;
```

---

## Category System Architecture

### Database Schema

**categories table:**

- `id`: UUID (primary key)
- `name`: Text (unique, not null)
- `icon`: Text (Lucide React icon name)
- `display_order`: Integer (for sorting)
- `created_at`: Timestamp

**subcategories table:**

- `id`: UUID (primary key)
- `category_id`: UUID (foreign key to categories)
- `name`: Text (not null)
- `display_order`: Integer (for sorting)
- `created_at`: Timestamp
- Unique constraint on (category_id, name)

### API Endpoints

**GET /api/categories**

- Returns all categories with their subcategories
- Sorted by display_order

**GET /api/categories/[id]/subcategories**

- Returns all subcategories for a specific category
- Validates category exists
- Sorted by display_order

### Validation

All category operations use Zod schemas for validation:

```typescript
import { categorySelectionSchema } from "@/lib/validations/category";

// Validates both category and subcategory are required
const result = categorySelectionSchema.parse({
  category_id: "uuid",
  subcategory_id: "uuid",
});
```

### Helper Functions

Located in `lib/utils/category-helpers.ts`:

- `validateSubcategoryBelongsToCategory()`: Validates subcategory belongs to parent
- `getCategoryForSubcategory()`: Gets parent category for a subcategory
- `getSubcategoriesByCategory()`: Gets all subcategories for a category
- `validateCategoryHierarchy()`: Validates category and subcategory relationship
- `validateListingCategories()`: Validates listing category requirements

---

## Nigerian Categories

The platform includes 12 main Nigerian categories:

1. **Electronics** (Smartphone icon) - Phones, Laptops, TVs, Accessories, etc.
2. **Fashion** (Shirt icon) - Clothing, Shoes, Bags, Jewelry, etc.
3. **Food** (UtensilsCrossed icon) - Groceries, Restaurants, Catering, etc.
4. **Real Estate** (Building2 icon) - Houses, Land, Apartments, Commercial, etc.
5. **Vehicles** (Car icon) - Cars, Motorcycles, Trucks, Parts, etc.
6. **Services** (Wrench icon) - Plumbing, Electrical, Cleaning, Repairs, etc.
7. **Jobs** (Briefcase icon) - Full-time, Part-time, Freelance, Internships, etc.
8. **Agriculture** (Wheat icon) - Crops, Livestock, Equipment, Produce, etc.
9. **Beauty** (Sparkles icon) - Salons, Makeup, Skincare, Barbering, etc.
10. **Education** (GraduationCap icon) - Tutoring, Courses, Schools, Training, etc.
11. **Events** (Calendar icon) - Venues, Planning, Catering, Entertainment, etc.
12. **Home** (Home icon) - Furniture, Appliances, Decor, Garden, etc.

Each category has 6-8 relevant subcategories tailored for the Nigerian market.

---

## Styling

All components use:

- **Tailwind CSS 4** for styling
- **Framer Motion** for animations
- **Glassmorphism** effects with backdrop blur
- **Neon colors**: Naira green (#00C853), Cyan blue (#15A3C7), Market orange (#FF9900)
- **Dark mode** as default theme

---

## Testing

Integration tests are located in `lib/__tests__/integration/category-system.test.ts`:

- Category hierarchy integrity
- Subcategory filtering by parent
- Category validation for listings
- API integration
- Icon validation
- All 12 Nigerian categories verification

Run tests:

```bash
npm run test -- lib/__tests__/integration/category-system.test.ts
```

---

## Requirements Fulfilled

✅ **Requirement 14.1**: Display all 12 main Nigerian categories with lucide-react icons  
✅ **Requirement 14.2**: Display associated subcategories when main category is selected  
✅ **Requirement 14.3**: Filter listings by subcategory using Typesense  
✅ **Requirement 14.4**: Require both main category and subcategory selection for listings (validated with Zod)  
✅ **Requirement 14.5**: Maintain hierarchical relationships in Supabase database

---

## Future Enhancements

- Category search/filter
- Category analytics (most popular categories)
- Dynamic category icons upload
- Category-specific featured listings
- Category recommendations based on user behavior
