# Technical Design Document: Browse Categories Page Enhancement

## Overview

This document provides the technical design for transforming the `/browse` page from a listings display into a comprehensive categories browsing experience. The enhancement includes:

1. **Categories Grid Display** - Responsive grid with animated category cards
2. **Search and Filtering** - Real-time category search with multiple sort options
3. **Category Detail Pages** - Hierarchical subcategory display with recursive depth support
4. **Translation System Removal** - Complete removal of multi-language infrastructure
5. **Footer Integration** - Site-wide footer display on all category pages

The design leverages Next.js 14 App Router patterns, Supabase for real-time data, Framer Motion for animations, and maintains WCAG 2.1 Level AA accessibility standards.

### Key Technical Decisions

- **Server Components First**: Use React Server Components for initial page loads and static data
- **Client Components for Interactivity**: Search, filters, and animations use client-side rendering
- **ISR for Performance**: Implement Incremental Static Regeneration with strategic revalidation intervals
- **Real-time Updates**: Use Supabase subscriptions for dynamic listing count updates
- **No Translation Layer**: Remove all translation infrastructure to simplify codebase

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Browser] --> B[/browse Page]
        A --> C[/categories/{slug} Page]
        B --> D[CategoryGrid Client Component]
        B --> E[SearchFilters Client Component]
        C --> F[SubcategoryGrid Client Component]
    end
    
    subgraph "Server Layer"
        B --> G[Server Component: BrowsePage]
        C --> H[Server Component: CategoryDetailPage]
        G --> I[Database Service Layer]
        H --> I
    end
    
    subgraph "Data Layer"
        I --> J[(Supabase: categories table)]
        I --> K[(Supabase: listings table)]
        J --> L[Real-time Subscriptions]
    end
    
    subgraph "Shared Components"
        D --> M[CategoryCard]
        F --> N[SubcategoryCard]
        M --> O[Next Image Component]
        N --> O
    end
```

### Component Hierarchy

```
app/
├── (public)/
│   └── browse/
│       └── page.tsx                    # Server Component - Main browse page
├── (main)/
│   └── categories/
│       └── [slug]/
│           └── page.tsx                # Server Component - Category detail page
│
components/
├── features/
│   ├── category-grid.tsx               # Client Component - Grid container with animations
│   ├── category-card.tsx               # Client Component - Individual category card (enhanced)
│   ├── subcategory-grid.tsx            # Client Component - Subcategory display grid
│   ├── subcategory-card.tsx            # Client Component - Glassmorphic subcategory card
│   ├── category-search.tsx             # Client Component - Search input with debounce
│   ├── category-filters.tsx            # Client Component - Filter controls
│   ├── category-preview-popover.tsx    # Client Component - Hover preview popover
│   └── category-stats.tsx              # Client Component - Statistics display
├── shared/
│   ├── breadcrumb.tsx                  # Client Component - Navigation breadcrumb
│   ├── loading-skeleton.tsx            # Client Component - Loading placeholder
│   └── empty-state.tsx                 # Client Component - No results display
└── layout/
    └── footer.tsx                      # Server Component - Site footer (existing)
```

### Data Flow

**Browse Page Load Flow:**
1. User navigates to `/browse` or `/browse?search=...&sort=...`
2. Server Component executes on server, reads URL params
3. Fetch categories from Supabase (with ISR caching)
4. Server renders initial HTML with category data
5. Client hydrates interactive components (search, filters, animations)
6. User interactions update URL params and trigger re-renders

**Category Detail Page Flow:**
1. User clicks category card → navigate to `/categories/{slug}`
2. Server Component fetches category by slug + subcategories
3. Server constructs hierarchical breadcrumb by traversing parent_id chain
4. Client hydrates subcategory grid with animations
5. Real-time subscription updates listing counts dynamically

**Search and Filter Flow:**
1. User types in search field → debounced state update (300ms)
2. Client filters categories array in-memory
3. Update URL query params via Next.js router
4. Re-render filtered grid with staggered animations

## Components and Interfaces

### 1. BrowsePage (Server Component)

**File:** `app/(public)/browse/page.tsx`

**Purpose:** Main server component for the browse categories page. Handles data fetching, URL param parsing, and initial rendering.

**Props Interface:**
```typescript
interface BrowsePageProps {
  searchParams: Promise<{
    search?: string;
    sort?: 'alphabetical-asc' | 'alphabetical-desc' | 'most-listings' | 'fewest-listings' | 'recently-updated';
    show_only?: 'top_level' | 'has_listings';
  }>;
}
```

**Key Responsibilities:**
- Parse URL search params
- Fetch all categories from database service
- Apply server-side filtering for `show_only` param
- Render CategoryGrid and SearchFilters components
- Implement ISR with 1-hour revalidation

**Example Structure:**
```typescript
export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const { search, sort, show_only } = params;
  
  // Fetch categories with potential filtering
  const categories = await getCategories();
  
  // Server-side filtering for show_only param
  let filteredCategories = categories;
  if (show_only === 'top_level') {
    filteredCategories = categories.filter(c => c.parent_id === null);
  } else if (show_only === 'has_listings') {
    filteredCategories = categories.filter(c => c.listing_count > 0);
  }
  
  return (
    <main>
      <CategorySearch initialSearch={search} />
      <CategoryFilters initialSort={sort} initialShowOnly={show_only} />
      <CategoryGrid categories={filteredCategories} initialSearch={search} initialSort={sort} />
      <Footer />
    </main>
  );
}

export const revalidate = 3600; // ISR: 1 hour
```

---

### 2. CategoryGrid (Client Component)

**File:** `components/features/category-grid.tsx`

**Purpose:** Client component that displays categories in a responsive grid with filtering, sorting, and animations.

**Props Interface:**
```typescript
interface CategoryGridProps {
  categories: Category[];
  initialSearch?: string;
  initialSort?: string;
}
```

**State Management:**
```typescript
const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
const [searchQuery, setSearchQuery] = useState(initialSearch || '');
const [sortOption, setSortOption] = useState(initialSort || 'alphabetical-asc');
```

**Key Responsibilities:**
- Client-side filtering based on search query (name and description)
- Client-side sorting based on selected option
- Responsive grid layout (1-4 columns)
- Staggered animation delays for category cards
- Empty state display when no results

**Grid Layout (Tailwind):**
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {filteredCategories.map((category, index) => (
    <CategoryCard key={category.id} category={category} index={index} />
  ))}
</div>
```

---

### 3. CategoryCard (Enhanced Client Component)

**File:** `components/features/category-card.tsx`

**Purpose:** Enhanced version of existing category card with animations, hover effects, and accessibility improvements.

**Props Interface:**
```typescript
interface CategoryCardProps {
  category: Category;
  index?: number; // For staggered animations
}
```

**New Features:**
- Framer Motion animations (fade-in, slide-up)
- Hover effects (scale, gradient border, image brightness)
- "Popular" badge (listing_count > 100)
- "Recently Updated" badge (updated within 7 days)
- "New" badge (created within 30 days)
- Subcategory count indicator
- Keyboard navigation with visible focus ring

**Animation Configuration:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
  whileHover={{ scale: 1.05 }}
  className="group relative"
>
  {/* Card content */}
</motion.div>
```

**Hover Gradient Border:**
```css
/* Implemented with pseudo-elements */
.category-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.category-card:hover::before {
  opacity: 1;
}
```

---

### 4. CategorySearch (Client Component)

**File:** `components/features/category-search.tsx`

**Purpose:** Search input with debouncing and URL state management.

**Props Interface:**
```typescript
interface CategorySearchProps {
  initialSearch?: string;
  onSearchChange: (query: string) => void;
}
```

**State Management:**
```typescript
const [query, setQuery] = useState(initialSearch || '');
const router = useRouter();
const pathname = usePathname();
const searchParams = useSearchParams();

// Debounced search with 300ms delay
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
    onSearchChange(value);
  }, 300),
  [searchParams, pathname, router, onSearchChange]
);
```

**UI Features:**
- Clear button when text is entered
- Search icon visual indicator
- Accessible label and placeholder
- Sticky positioning on mobile

---

### 5. CategoryFilters (Client Component)

**File:** `components/features/category-filters.tsx`

**Purpose:** Filter controls for sorting and filtering categories.

**Props Interface:**
```typescript
interface CategoryFiltersProps {
  initialSort?: string;
  initialShowOnly?: string;
  onSortChange: (sort: string) => void;
  onShowOnlyChange: (showOnly: string | null) => void;
}
```

**Filter Options:**
```typescript
const sortOptions = [
  { value: 'alphabetical-asc', label: 'Alphabetical (A-Z)' },
  { value: 'alphabetical-desc', label: 'Alphabetical (Z-A)' },
  { value: 'most-listings', label: 'Most Listings' },
  { value: 'fewest-listings', label: 'Fewest Listings' },
  { value: 'recently-updated', label: 'Recently Updated' }
];

const showOnlyOptions = [
  { value: 'top_level', label: 'Top-level Categories Only' },
  { value: 'has_listings', label: 'Categories with Listings' }
];
```

**UI Layout:**
- Dropdown for sort options
- Checkbox toggles for show_only filters
- Mobile: vertical stack, Desktop: horizontal row
- Updates URL params on change

---

### 6. CategoryPreviewPopover (Client Component)

**File:** `components/features/category-preview-popover.tsx`

**Purpose:** Hover popover showing subcategories and top listings (desktop only).

**Props Interface:**
```typescript
interface CategoryPreviewPopoverProps {
  category: Category;
  children: React.ReactNode; // Trigger element (CategoryCard)
}
```

**Data Fetching:**
```typescript
const [previewData, setPreviewData] = useState<{
  subcategories: Category[];
  topListings: Listing[];
} | null>(null);

const fetchPreviewData = async () => {
  const supabase = createClientComponentClient();
  
  // Fetch subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .limit(5);
  
  // Fetch top 3 listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, images')
    .eq('category_id', category.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(3);
  
  setPreviewData({ subcategories, listings });
};
```

**Hover Behavior:**
- Show after 500ms hover delay
- Hide after 200ms mouse leave
- Desktop only (min-width: 1024px)
- Positioned using floating-ui library

---

### 7. CategoryDetailPage (Server Component)

**File:** `app/(main)/categories/[slug]/page.tsx`

**Purpose:** Server component for individual category detail pages with subcategory hierarchy.

**Props Interface:**
```typescript
interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
}
```

**Data Fetching:**
```typescript
export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = await params;
  
  // Fetch category with subcategories
  const category = await getCategoryBySlug(slug, true);
  
  if (!category) {
    notFound();
  }
  
  // Build breadcrumb by traversing parent chain
  const breadcrumb = await buildCategoryBreadcrumb(category);
  
  return (
    <main>
      <Breadcrumb items={breadcrumb} />
      {category.parent_id && (
        <BackButton parentCategory={await getParentCategory(category.parent_id)} />
      )}
      <CategoryHeader category={category} />
      {category.subcategories && category.subcategories.length > 0 && (
        <SubcategoryGrid subcategories={category.subcategories} />
      )}
      <CategoryListingsSection categoryId={category.id} />
      <Footer />
    </main>
  );
}

export const revalidate = 1800; // ISR: 30 minutes
```

**Breadcrumb Construction:**
```typescript
async function buildCategoryBreadcrumb(category: Category): Promise<BreadcrumbItem[]> {
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
  
  // Traverse parent chain recursively
  let current = category;
  const path: Category[] = [];
  
  while (current.parent_id) {
    const parent = await getCategoryById(current.parent_id);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  
  // Add all parents to breadcrumb
  for (const cat of path) {
    items.push({ label: cat.name, href: `/categories/${cat.slug}` });
  }
  
  // Add current category
  items.push({ label: category.name, href: `/categories/${category.slug}` });
  
  return items;
}
```

---

### 8. SubcategoryGrid (Client Component)

**File:** `components/features/subcategory-grid.tsx`

**Purpose:** Display subcategories in a responsive grid with animations.

**Props Interface:**
```typescript
interface SubcategoryGridProps {
  subcategories: Category[];
}
```

**Real-time Updates:**
```typescript
useEffect(() => {
  const supabase = createClientComponentClient();
  
  // Subscribe to listing count changes
  const channel = supabase
    .channel('subcategory-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'listings',
        filter: `category_id=in.(${subcategories.map(s => s.id).join(',')})`
      },
      () => {
        // Refresh subcategory data
        refreshSubcategories();
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [subcategories]);
```

**Grid Layout:**
```typescript
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {subcategories.map((subcategory, index) => (
    <SubcategoryCard key={subcategory.id} subcategory={subcategory} index={index} />
  ))}
</div>
```

---

### 9. SubcategoryCard (Client Component)

**File:** `components/features/subcategory-card.tsx`

**Purpose:** Glassmorphic card for displaying subcategories with nested indicator.

**Props Interface:**
```typescript
interface SubcategoryCardProps {
  subcategory: Category;
  index: number;
}
```

**Glassmorphism Styling:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.08 }}
  whileHover={{ scale: 1.03 }}
  className={cn(
    "relative overflow-hidden rounded-xl",
    "bg-white/10 backdrop-blur-md",
    "border border-white/20",
    "hover:border-primary-400/50",
    "hover:shadow-xl hover:shadow-primary-500/20",
    "transition-all duration-200"
  )}
>
  {/* Card content */}
</motion.div>
```

**Nested Subcategory Indicator:**
```typescript
{subcategory.hasChildren && (
  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-gray-900/80 backdrop-blur-sm rounded-full">
    <ChevronRight className="w-3 h-3 text-gray-300" />
    <span className="text-xs text-gray-300">{subcategory.childCount}</span>
  </div>
)}
```

---

### 10. Breadcrumb (Shared Component)

**File:** `components/shared/breadcrumb.tsx`

**Purpose:** Accessible breadcrumb navigation with structured data.

**Props Interface:**
```typescript
interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
```

**Structured Data:**
```typescript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.label,
    "item": `https://findam.ng${item.href}`
  }))
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
    <nav aria-label="breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index}>
            {index < items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  </>
);
```

---

### 11. LoadingSkeleton (Shared Component)

**File:** `components/shared/loading-skeleton.tsx`

**Purpose:** Shimmer loading placeholder for category grids.

**Props Interface:**
```typescript
interface LoadingSkeletonProps {
  count?: number; // Number of skeleton cards (default: 8)
  layout?: 'grid' | 'list';
}
```

**Shimmer Animation:**
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 1000px 100%;
}
```

---

### 12. EmptyState (Shared Component)

**File:** `components/shared/empty-state.tsx`

**Purpose:** Display when no categories match search/filter criteria.

**Props Interface:**
```typescript
interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}
```

**Default Icons:**
- Search: `<Search className="w-12 h-12" />`
- Error: `<AlertCircle className="w-12 h-12" />`
- Empty: `<Package className="w-12 h-12" />`

---

### 13. CategoryStats (Client Component)

**File:** `components/features/category-stats.tsx`

**Purpose:** Display statistics section showing total categories and listings.

**Props Interface:**
```typescript
interface CategoryStatsProps {
  totalCategories: number;
  totalListings: number;
  trendingCategories: Category[];
}
```

**Statistics Display:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <StatCard
    icon={<FolderOpen />}
    label="Total Categories"
    value={totalCategories}
  />
  <StatCard
    icon={<Package />}
    label="Total Listings"
    value={totalListings}
  />
  <StatCard
    icon={<TrendingUp />}
    label="Trending This Week"
    value={trendingCategories.length}
  />
</div>
```

**Trending Section:**
```typescript
<section className="mb-8">
  <h2 className="text-2xl font-bold mb-4">Trending Categories</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {trendingCategories.slice(0, 3).map((category) => (
      <TrendingCategoryCard key={category.id} category={category} />
    ))}
  </div>
</section>
```

## Data Models

### Category Model (Enhanced)

The existing `Category` type in `lib/types/core.ts` remains unchanged, but we'll add computed properties for badges:

```typescript
export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  display_order: number;
  listing_count: number;
  created_at?: string;
  updated_at?: string;
}

// Computed properties helper
export function getCategoryBadges(category: Category): {
  isPopular: boolean;
  isRecentlyUpdated: boolean;
  isNew: boolean;
} {
  const now = new Date();
  const updatedAt = category.updated_at ? new Date(category.updated_at) : null;
  const createdAt = category.created_at ? new Date(category.created_at) : null;
  
  return {
    isPopular: category.listing_count > 100,
    isRecentlyUpdated: updatedAt 
      ? (now.getTime() - updatedAt.getTime()) < 7 * 24 * 60 * 60 * 1000 
      : false,
    isNew: createdAt 
      ? (now.getTime() - createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000 
      : false
  };
}
```

### Extended Category with Subcategories

Used by `getCategoryBySlug` with `includeSubcategories: true`:

```typescript
export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
  hasChildren: boolean; // Convenience flag
  childCount: number;   // Number of direct children
}
```

### Breadcrumb Item Model

```typescript
export interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean; // True for the last item
}
```

### Filter State Model

```typescript
export interface CategoryFilterState {
  search: string;
  sort: 'alphabetical-asc' | 'alphabetical-desc' | 'most-listings' | 'fewest-listings' | 'recently-updated';
  showOnly: 'top_level' | 'has_listings' | null;
}
```

### Preview Data Model

```typescript
export interface CategoryPreviewData {
  subcategories: Category[];
  topListings: {
    id: string;
    title: string;
    images: string[];
  }[];
}
```

## Database Schema Changes

### Translation Columns Removal

**New Migration File:** `supabase/migrations/0XX_remove_translation_columns.sql`

```sql
-- Remove translation infrastructure from categories table
-- Requirements: 17.1, 17.2, 17.3, 17.4

-- Drop GIN indexes
DROP INDEX IF EXISTS idx_categories_name_translations;
DROP INDEX IF EXISTS idx_categories_description_translations;

-- Drop translation columns
ALTER TABLE categories DROP COLUMN IF EXISTS name_translations;
ALTER TABLE categories DROP COLUMN IF EXISTS description_translations;

-- Update table comment to remove translation references
COMMENT ON TABLE categories IS 
  'Hierarchical category taxonomy supporting unlimited nesting levels via parent_id. Each category can have subcategories, which can have their own subcategories, enabling flexible category structures.';

-- Verification
DO $$ 
BEGIN
  RAISE NOTICE 'Translation columns and indexes removed successfully';
  RAISE NOTICE '  - Dropped: name_translations column';
  RAISE NOTICE '  - Dropped: description_translations column';
  RAISE NOTICE '  - Dropped: idx_categories_name_translations index';
  RAISE NOTICE '  - Dropped: idx_categories_description_translations index';
  RAISE NOTICE '  - System now operates in English-only mode';
END $$;
```

### Add Slug Column (if not exists)

The `slug` field is required for URL routing but may not exist in the current schema:

**Migration:** `supabase/migrations/0XX_add_category_slug.sql`

```sql
-- Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'slug'
  ) THEN
    -- Add slug column
    ALTER TABLE categories ADD COLUMN slug TEXT;
    
    -- Generate slugs for existing categories
    UPDATE categories 
    SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Make slug NOT NULL and unique
    ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);
    
    RAISE NOTICE 'Slug column added and populated for all categories';
  ELSE
    RAISE NOTICE 'Slug column already exists';
  END IF;
END $$;
```

### Database Queries for Enhanced Features

**Get Categories with Subcategory Count:**
```sql
SELECT 
  c.*,
  COUNT(sc.id) as child_count,
  EXISTS(SELECT 1 FROM categories sc WHERE sc.parent_id = c.id) as has_children
FROM categories c
LEFT JOIN categories sc ON sc.parent_id = c.id
GROUP BY c.id
ORDER BY c.display_order, c.name;
```

**Get Category Hierarchy (Recursive CTE):**
```sql
WITH RECURSIVE category_path AS (
  -- Base case: start with the given category
  SELECT id, name, slug, parent_id, 0 as depth
  FROM categories
  WHERE slug = $1
  
  UNION ALL
  
  -- Recursive case: get parent categories
  SELECT c.id, c.name, c.slug, c.parent_id, cp.depth + 1
  FROM categories c
  INNER JOIN category_path cp ON c.id = cp.parent_id
)
SELECT * FROM category_path ORDER BY depth DESC;
```

## Error Handling

### Error Boundary Strategy

**Global Error Boundary:** `app/error.tsx`
```typescript
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service (e.g., Sentry)
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-6">
          {process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

**Page-Level Error Handling:**
```typescript
// In BrowsePage
try {
  const categories = await getCategories();
  if (!categories) {
    throw new Error('Failed to fetch categories');
  }
} catch (error) {
  return (
    <ErrorDisplay
      title="Failed to load categories"
      message="Please try again later"
      action={{
        label: 'Retry',
        href: '/browse'
      }}
    />
  );
}
```

### Data Fetching Error Handling

**Database Service Layer:**
```typescript
export async function getCategories(): Promise<Category[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      // Log to monitoring service
      logError('getCategories', error);
      return null;
    }

    return data ? data.map(transformCategory) : [];
  } catch (error) {
    console.error('Unexpected error in getCategories:', error);
    logError('getCategories', error);
    return null;
  }
}
```

### Client-Side Error States

**Search/Filter Errors:**
```typescript
const [error, setError] = useState<string | null>(null);

try {
  // Filtering logic
  const filtered = categories.filter(/* ... */);
  setFilteredCategories(filtered);
  setError(null);
} catch (err) {
  setError('Failed to filter categories');
  console.error(err);
}

{error && (
  <Alert variant="error">
    {error}
  </Alert>
)}
```

**Image Load Errors:**
```typescript
<Image
  src={category.image_url || fallbackImage}
  alt={category.name}
  fill
  onError={(e) => {
    e.currentTarget.src = fallbackImage;
  }}
/>
```

### Not Found Handling

**Category Not Found:** `app/(main)/categories/[slug]/not-found.tsx`
```typescript
export default function CategoryNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Category Not Found</h1>
        <p className="text-gray-400 mb-6">
          The category you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/browse"
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
        >
          Browse All Categories
        </Link>
      </div>
    </div>
  );
}
```

## Testing Strategy

### Unit Testing

**Tools:** Jest, React Testing Library

**Test Coverage:**

1. **Utility Functions:**
   - `getCategoryBadges()` - Test badge logic for all scenarios
   - `buildCategoryBreadcrumb()` - Test hierarchical path construction
   - Category filtering logic - Test search and filter combinations
   - Category sorting logic - Test all sort options

2. **Component Tests:**
   - **CategoryCard:** Renders correctly, shows badges, handles image errors
   - **CategorySearch:** Debouncing works, clear button functions
   - **CategoryFilters:** All filter options work, URL params update
   - **Breadcrumb:** Renders correct path, structured data is valid
   - **EmptyState:** Shows appropriate message based on props

**Example Test:**
```typescript
describe('getCategoryBadges', () => {
  it('should mark category as popular when listing_count > 100', () => {
    const category: Category = {
      id: '1',
      name: 'Test',
      slug: 'test',
      parent_id: null,
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 150,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    const badges = getCategoryBadges(category);
    expect(badges.isPopular).toBe(true);
  });

  it('should mark category as new when created within 30 days', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const category: Category = {
      /* ... */
      created_at: yesterday.toISOString(),
      listing_count: 10
    };

    const badges = getCategoryBadges(category);
    expect(badges.isNew).toBe(true);
  });
});
```

### Integration Testing

**Tools:** Playwright, MSW (Mock Service Worker)

**Test Scenarios:**

1. **Browse Page Flow:**
   - Load page → Categories display
   - Search for category → Results filter
   - Apply sort option → Order changes
   - Apply show_only filter → Categories filter
   - Click category card → Navigate to detail page

2. **Category Detail Page Flow:**
   - Load category page → Category data displays
   - Breadcrumb navigation → Correct path shown
   - Click subcategory → Navigate to subcategory
   - Back button → Return to parent

3. **Real-time Updates:**
   - Mock Supabase subscription
   - Trigger listing count change
   - Verify UI updates

**Example Integration Test:**
```typescript
test('search and filter workflow', async ({ page }) => {
  await page.goto('/browse');

  // Wait for categories to load
  await page.waitForSelector('[data-testid="category-card"]');

  // Search for "Electronics"
  await page.fill('[data-testid="category-search"]', 'Electronics');
  await page.waitForTimeout(300); // Debounce delay

  // Verify filtered results
  const cards = await page.$$('[data-testid="category-card"]');
  expect(cards.length).toBeGreaterThan(0);

  // Verify all cards contain "Electronics"
  for (const card of cards) {
    const text = await card.textContent();
    expect(text?.toLowerCase()).toContain('electronics');
  }

  // Clear search
  await page.click('[data-testid="clear-search"]');

  // Verify all categories shown again
  const allCards = await page.$$('[data-testid="category-card"]');
  expect(allCards.length).toBeGreaterThan(cards.length);
});
```

### Accessibility Testing

**Tools:** axe-core, WAVE, manual keyboard testing

**Test Checklist:**
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all focusable elements
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA labels on icon buttons
- [ ] Color contrast meets WCAG 2.1 Level AA (4.5:1)
- [ ] Screen reader announces category names and counts
- [ ] Skip links for keyboard users
- [ ] No keyboard traps

**Example Accessibility Test:**
```typescript
test('keyboard navigation works correctly', async ({ page }) => {
  await page.goto('/browse');

  // Tab to search field
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('category-search');

  // Tab to first category card
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('category-card');

  // Press Enter to navigate
  await page.keyboard.press('Enter');

  // Should navigate to category detail page
  await page.waitForURL(/\/categories\/.+/);
  expect(page.url()).toContain('/categories/');
});
```

### Performance Testing

**Tools:** Lighthouse CI, WebPageTest

**Performance Targets:**
- Lighthouse Performance Score: > 90
- First Contentful Paint (FCP): < 1.5s on 3G
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

**Test Configuration:**
```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/browse',
        'http://localhost:3000/categories/electronics'
      ],
      numberOfRuns: 3,
      settings: {
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    }
  }
};
```

### Visual Regression Testing

**Tools:** Percy, Chromatic

**Test Scenarios:**
- Browse page: desktop, tablet, mobile
- Category detail page with subcategories
- Empty states
- Loading skeletons
- Hover states (desktop only)
- Focus states

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining properties, I need to analyze the acceptance criteria to determine which are suitable for property-based testing.

### Acceptance Criteria Testing Prework

**1.1 WHEN THE Browse_Categories_Page loads, THE Browse_Categories_Page SHALL fetch all categories from the database ordered by display_order**
  Thoughts: This is testing database query behavior which is infrastructure, not our code's logic. We should use integration tests with 1-3 examples to verify the ordering works correctly.
  Classification: INTEGRATION
  Test Strategy: Run integration test verifying categories are returned in display_order sequence

**1.2 WHEN categories are fetched successfully, THE Category_Grid SHALL display all categories in a responsive grid layout**
  Thoughts: This is UI rendering behavior - testing that categories display in a grid. This doesn't have meaningful input variation for PBT.
  Classification: EXAMPLE
  Test Strategy: Use example-based tests with different category counts

**1.3 THE Category_Grid SHALL display 1 column on mobile (< 640px), 2 columns on tablet (640-1024px), 3 columns on desktop (1024-1280px), and 4 columns on large screens (>= 1280px)**
  Thoughts: This is testing responsive breakpoints - specific screen width values. Use example-based tests for each breakpoint.
  Classification: EXAMPLE
  Test Strategy: Test each breakpoint with fixed viewport sizes

**1.4 WHEN a category has subcategories, THE Category_Card SHALL display a visual indicator showing the number of subcategories**
  Thoughts: This is testing that UI displays correctly based on category data. For any category with subcategories, the indicator should show. We can generate random categories with varying subcategory counts and verify the indicator appears with the correct count.
  Classification: PROPERTY
  Test Strategy: Generate categories with 0 to N subcategories, verify indicator displays correctly

**1.5 THE Category_Card SHALL display the category image with a fallback placeholder if image_url is null or invalid**
  Thoughts: This is testing image fallback logic across all possible image_url values (null, invalid URL, valid URL). This is a universal property.
  Classification: PROPERTY
  Test Strategy: Generate categories with null, invalid, and valid image_urls, verify correct image or fallback displays

**1.6 THE Category_Card SHALL display the category name, description (truncated to 2 lines), and listing count**
  Thoughts: This tests that rendering includes all required fields. For any category, these fields should appear in the rendered output.
  Classification: PROPERTY
  Test Strategy: Generate random categories, verify rendered HTML contains name, description (truncated), and listing count

**1.7 WHEN the user clicks a Category_Card, THE Browse_Categories_Page SHALL navigate to `/categories/{slug}`**
  Thoughts: This is testing click behavior for all categories. For any category with a valid slug, clicking should navigate to the correct URL.
  Classification: PROPERTY
  Test Strategy: Generate categories with various slugs, verify click triggers correct navigation

**2.1 THE Browse_Categories_Page SHALL display a Category_Search input field above the Category_Grid**
  Thoughts: This is checking that a specific UI element exists in the rendering.
  Classification: EXAMPLE
  Test Strategy: Single test verifying search input is present

**2.2 WHEN the user types in the Category_Search field, THE Browse_Categories_Page SHALL filter categories where the name contains the search query (case-insensitive)**
  Thoughts: This is testing search filtering logic. For any search query and any set of categories, filtering by name should work correctly. This varies meaningfully with input.
  Classification: PROPERTY
  Test Strategy: Generate random search queries and category lists, verify filtering works

**2.3 WHEN the user types in the Category_Search field, THE Browse_Categories_Page SHALL also filter categories where the description contains the search query (case-insensitive)**
  Thoughts: Similar to 2.2, this tests search across description field. For any query, description filtering should work.
  Classification: PROPERTY
  Test Strategy: Generate random queries and categories, verify description search works

**2.4 WHEN search results are empty, THE Browse_Categories_Page SHALL display an Empty_State with a message and clear search button**
  Thoughts: This is testing specific UI behavior when results are empty - a specific condition.
  Classification: EXAMPLE
  Test Strategy: Test with query that returns no results, verify empty state displays

**2.5 THE Category_Search SHALL debounce user input by 300ms before applying filters**
  Thoughts: This is testing timing behavior - that rapid input is debounced. This is a specific timing requirement.
  Classification: EXAMPLE
  Test Strategy: Simulate rapid keystrokes, verify filtering only happens after 300ms

**2.6 THE Category_Search SHALL display a clear button when text is entered**
  Thoughts: This is testing UI state - clear button appears when text exists. For any non-empty input, button should appear.
  Classification: PROPERTY
  Test Strategy: Generate random non-empty input, verify clear button present

**2.7 WHEN the user clears the search, THE Browse_Categories_Page SHALL display all categories again**
  Thoughts: This is testing that clearing restores full list. For any filtered state, clearing should restore all categories.
  Classification: PROPERTY
  Test Strategy: Filter to any subset, clear search, verify all categories return

**3.1-3.7 Sort Options**
  Thoughts: These test sorting logic. For any list of categories, sorting by different criteria should produce correct order.
  Classification: PROPERTY
  Test Strategy: Generate random category lists, verify each sort produces correctly ordered results

**3.8 THE Browse_Categories_Page SHALL provide a filter to show only top-level categories (parent_id is null)**
  Thoughts: For any category list, filtering by parent_id should return only top-level.
  Classification: PROPERTY
  Test Strategy: Generate categories with mixed parent_id values, verify filter works

**3.9 THE Browse_Categories_Page SHALL provide a filter to show only categories with active listings (listing_count > 0)**
  Thoughts: For any category list, filtering by listing_count > 0 should work correctly.
  Classification: PROPERTY
  Test Strategy: Generate categories with varying listing_counts, verify filter works

**3.10 WHEN filters or sort options are applied, THE Browse_Categories_Page SHALL update the URL with query parameters to enable sharing and bookmarking**
  Thoughts: For any filter/sort combination, URL should reflect state.
  Classification: PROPERTY
  Test Strategy: Apply random filter/sort combinations, verify URL contains correct params

**4.1 THE Browse_Categories_Page SHALL display a statistics section showing total categories count and total listings across all categories**
  Thoughts: This is testing rendering of computed statistics - specific UI element.
  Classification: EXAMPLE
  Test Strategy: Verify statistics section renders with correct counts

**4.2 WHEN a category has listing_count > 100, THE Category_Card SHALL display a "Popular" badge**
  Thoughts: For any category with listing_count > 100, badge should appear.
  Classification: PROPERTY
  Test Strategy: Generate categories with various listing_counts, verify badge appears correctly

**4.3 WHEN a category has been updated within the last 7 days, THE Category_Card SHALL display a "Recently Updated" badge**
  Thoughts: For any category updated within 7 days, badge should appear.
  Classification: PROPERTY
  Test Strategy: Generate categories with various update timestamps, verify badge logic

**4.4 THE Browse_Categories_Page SHALL display a "Trending" section above the main grid showing the top 3 categories by listing count**
  Thoughts: For any category set, trending should show top 3 by count.
  Classification: PROPERTY
  Test Strategy: Generate random categories, verify trending shows correct top 3

**4.5 THE Browse_Categories_Page SHALL display a "New" badge on categories created within the last 30 days**
  Thoughts: For any category created within 30 days, badge should appear.
  Classification: PROPERTY
  Test Strategy: Generate categories with various creation dates, verify badge logic

**5.1-5.7 Enhanced Category Cards (Animation and Visual)**
  Thoughts: These test animations, hover effects, and visual enhancements - UI behavior that's difficult to test with PBT.
  Classification: EXAMPLE
  Test Strategy: Visual regression tests, manual testing

**6.1-6.6 Category Preview on Hover**
  Thoughts: These test hover preview popover behavior - interaction and timing that's not suitable for PBT.
  Classification: INTEGRATION
  Test Strategy: Integration tests with user simulation

**7.1-7.5 Breadcrumb Navigation**
  Thoughts: For any category hierarchy, breadcrumb should show correct path.
  Classification: PROPERTY
  Test Strategy: Generate categories with varying depths, verify breadcrumb construction

**8.1-8.6 Mobile-Responsive Design**
  Thoughts: These test responsive breakpoints and touch interactions - specific UI behavior.
  Classification: EXAMPLE
  Test Strategy: Responsive testing at each breakpoint

**9.1-9.8 Keyboard Navigation and Accessibility**
  Thoughts: These test keyboard behavior and accessibility - interaction patterns that need manual/integration testing.
  Classification: INTEGRATION
  Test Strategy: Keyboard navigation testing, axe-core scans

**10.1-10.7 SEO Optimization**
  Thoughts: These test meta tags and SEO elements - specific page metadata.
  Classification: EXAMPLE
  Test Strategy: Verify meta tags present with correct content

**11.1-11.8 Performance Optimizations**
  Thoughts: These test performance metrics - infrastructure and optimization.
  Classification: INTEGRATION
  Test Strategy: Lighthouse CI, performance testing

**12.1-12.6 Empty States and Error Handling**
  Thoughts: These test specific error conditions and UI states.
  Classification: EXAMPLE
  Test Strategy: Test each error scenario individually

**13.1-13.5 Loading Skeletons**
  Thoughts: These test loading UI - specific visual state.
  Classification: EXAMPLE
  Test Strategy: Test loading state display

**14.1-14.7 Navigation Bar Integration**
  Thoughts: These test navigation bar behavior - specific UI element integration.
  Classification: EXAMPLE
  Test Strategy: Test navigation links work correctly

**15.1-15.7 URL State Management**
  Thoughts: For any filter state, URL should reflect and restore correctly. This is a round-trip property.
  Classification: PROPERTY
  Test Strategy: Generate random filter states, serialize to URL, deserialize, verify equivalence

**16.1-16.52 Category Detail Page with Subcategories**
  Thoughts: Many of these are UI rendering (EXAMPLE), but breadcrumb construction (16.11-16.14) is a property - for any category hierarchy, breadcrumb should be correct.
  Classification: Mixed (mostly EXAMPLE, some PROPERTY for breadcrumb)
  Test Strategy: Property test breadcrumb construction, example tests for UI

**17.1-17.25 Remove Multi-Language Translation**
  Thoughts: These are infrastructure changes - migration execution and code cleanup.
  Classification: INTEGRATION
  Test Strategy: Migration tests, verify translation code removed

**18.1-18.20 Footer Display**
  Thoughts: These test footer rendering and display - specific UI integration.
  Classification: EXAMPLE
  Test Strategy: Verify footer renders on all pages

### Prework Property Reflection

After analyzing all acceptance criteria, I've identified the following properties. Let me check for redundancy:

1. **Image fallback property** (1.5) - Unique validation
2. **Category card rendering property** (1.6) - Unique validation
3. **Navigation property** (1.7) - Unique validation
4. **Search by name property** (2.2) - Can be combined with 2.3
5. **Search by description property** (2.3) - Can be combined with 2.2
6. **Clear button visibility property** (2.6) - Unique validation
7. **Search clear restoration property** (2.7) - Unique validation
8. **Sorting properties** (3.1-3.7) - Multiple sort criteria, but can be ONE property
9. **Top-level filter property** (3.8) - Unique validation
10. **Active listings filter property** (3.9) - Unique validation
11. **URL state property** (3.10) - Unique validation
12. **Popular badge property** (4.2) - Can be combined with 4.3 and 4.5 into badge logic property
13. **Recently updated badge property** (4.3) - Can be combined into badge logic property
14. **Trending categories property** (4.4) - Unique validation
15. **New badge property** (4.5) - Can be combined into badge logic property
16. **Breadcrumb construction property** (7.1-7.5) - Unique validation
17. **URL state round-trip property** (15.1-15.7) - This is the same as 3.10, redundant

**Consolidation:**
- Combine 2.2 and 2.3 into single "search filtering" property
- Combine 4.2, 4.3, 4.5 into single "badge logic" property
- Remove 15.1-15.7 as redundant with 3.10
- Combine all sort options (3.1-3.7) into single "sorting" property

### Property 1: Image Fallback Handling

*For any* category, if the image_url is null or invalid, then rendering the category card should display the fallback placeholder image; if image_url is valid, it should display that image.

**Validates: Requirements 1.5**

### Property 2: Category Card Required Fields

*For any* category, the rendered category card HTML should contain the category name, description (truncated if longer than 2 lines), and listing count.

**Validates: Requirements 1.6**

### Property 3: Category Navigation Links

*For any* category with a valid slug, clicking the category card should trigger navigation to `/categories/{slug}`.

**Validates: Requirements 1.7**

### Property 4: Search Filtering Completeness

*For any* search query and category list, filtering should return all categories where either the name or description contains the query (case-insensitive), and exclude all categories that don't match.

**Validates: Requirements 2.2, 2.3**

### Property 5: Clear Button Visibility

*For any* non-empty search input, the clear button should be visible in the UI; when input is empty, the clear button should not be visible.

**Validates: Requirements 2.6**

### Property 6: Search Clear Restoration

*For any* filtered category state, clearing the search should restore the display to show all categories again.

**Validates: Requirements 2.7**

### Property 7: Category Sorting Correctness

*For any* category list and sort option (alphabetical ascending/descending, most/fewest listings, recently updated), applying the sort should produce a correctly ordered list according to the selected criteria.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 8: Top-Level Filter Correctness

*For any* category list, applying the "top-level only" filter should return only categories where parent_id is null, and exclude all categories with non-null parent_id.

**Validates: Requirements 3.8**

### Property 9: Active Listings Filter Correctness

*For any* category list, applying the "has active listings" filter should return only categories where listing_count > 0, and exclude all categories with listing_count = 0.

**Validates: Requirements 3.9**

### Property 10: URL State Persistence

*For any* filter state (search query, sort option, show_only toggles), applying those filters should update the URL query parameters to reflect the current state, enabling the page to be bookmarked or shared.

**Validates: Requirements 3.10**

### Property 11: Badge Logic Correctness

*For any* category:
- If listing_count > 100, the "Popular" badge should display
- If updated_at is within the last 7 days, the "Recently Updated" badge should display  
- If created_at is within the last 30 days, the "New" badge should display
- If none of these conditions are met, no badges should display

**Validates: Requirements 4.2, 4.3, 4.5**

### Property 12: Trending Categories Selection

*For any* category list, the trending section should display the top 3 categories sorted by listing_count (descending), or fewer if less than 3 categories exist.

**Validates: Requirements 4.4**

### Property 13: Breadcrumb Path Construction

*For any* category in the hierarchy, the breadcrumb should show the complete path from Home through all parent categories to the current category, constructed by recursively traversing the parent_id chain.

**Validates: Requirements 7.1, 7.2, 7.3, 16.11, 16.12**

### Property 14: Subcategory Count Indicator

*For any* category with subcategories (children exist where parent_id equals category.id), the category card should display a visual indicator showing the count of direct child categories.

**Validates: Requirements 1.4**

## Performance Optimizations

### 1. Incremental Static Regeneration (ISR)

**Browse Page:**
```typescript
// app/(public)/browse/page.tsx
export const revalidate = 3600; // 1 hour
```
- Static generation with 1-hour revalidation
- First user gets cached page
- After 1 hour, next user triggers revalidation
- Subsequent users get fresh cached page

**Category Detail Page:**
```typescript
// app/(main)/categories/[slug]/page.tsx
export const revalidate = 1800; // 30 minutes
```
- More frequent revalidation for dynamic content
- Balances freshness with performance

### 2. Image Optimization

**Next.js Image Component Configuration:**
```typescript
<Image
  src={category.image_url || fallbackImage}
  alt={category.name}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
  loading={index < 6 ? 'eager' : 'lazy'}
  priority={index < 6}
  placeholder="blur"
  blurDataURL={generateBlurDataURL(category.image_url)}
/>
```

**Blur Placeholder Generation:**
```typescript
function generateBlurDataURL(src: string | null): string {
  // Generate SVG blur placeholder
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#1f2937"/>
    </svg>
  `)}`;
}
```

### 3. Code Splitting

**Dynamic Imports for Heavy Components:**
```typescript
// app/(public)/browse/page.tsx
const CategoryPreviewPopover = dynamic(
  () => import('@/components/features/category-preview-popover').then(mod => ({ default: mod.CategoryPreviewPopover })),
  { ssr: false }
);
```

**Lazy Load Animations:**
```typescript
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div));
```

### 4. Database Query Optimization

**Batch Fetch with Relations:**
```typescript
// Single query with joins instead of N+1 queries
const { data: categories } = await supabase
  .from('categories')
  .select(`
    *,
    subcategories:categories!parent_id(count)
  `)
  .order('display_order', { ascending: true });
```

**Index Usage:**
```sql
-- Ensure indexes exist for common queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_listing_count ON categories(listing_count DESC);
```

### 5. React Server Components (RSC)

**Maximize Server Rendering:**
- Fetch data in Server Components
- Render initial HTML on server
- Minimize JavaScript sent to client
- Only mark components as 'use client' when necessary

**Pattern:**
```typescript
// Server Component (default)
async function CategoryPage() {
  const categories = await getCategories(); // Server-side fetch
  return <CategoryGrid categories={categories} />; // Serializable props
}

// Client Component (opt-in)
'use client';
function CategoryGrid({ categories }) {
  const [filtered, setFiltered] = useState(categories);
  // Client-side interactivity
}
```

### 6. Suspense Boundaries

**Streaming with Suspense:**
```typescript
<Suspense fallback={<LoadingSkeleton count={8} />}>
  <CategoryGrid categories={categories} />
</Suspense>
```

**Progressive Enhancement:**
- Show loading skeleton immediately
- Stream category data as it loads
- Hydrate interactive components

### 7. Memoization

**React useMemo for Expensive Computations:**
```typescript
const filteredCategories = useMemo(() => {
  return categories
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical-asc': return a.name.localeCompare(b.name);
        case 'alphabetical-desc': return b.name.localeCompare(a.name);
        case 'most-listings': return b.listing_count - a.listing_count;
        // ... other cases
      }
    });
}, [categories, searchQuery, sortOption]);
```

### 8. Debouncing

**Search Input Debounce:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setSearchQuery(value);
    updateURLParams({ search: value });
  },
  300
);
```

### 9. Reduced Motion Support

**Respect User Preferences:**
```typescript
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial={!prefersReducedMotion && { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
>
```

### 10. Bundle Size Optimization

**Analyze Bundle:**
```bash
npm run build
npm run analyze
```

**Tree Shaking:**
- Import only used components: `import { motion } from 'framer-motion'` → `import { motion } from 'framer-motion/dist/framer-motion'`
- Use Next.js's automatic tree shaking

## Migration and Deployment Strategy

### Phase 1: Database Migrations

**Step 1: Add slug column (if needed)**
```bash
npx supabase migration new add_category_slug
```

**Step 2: Remove translation columns**
```bash
npx supabase migration new remove_translation_columns
```

**Step 3: Apply migrations**
```bash
npx supabase db push
```

**Validation:**
```sql
-- Verify schema changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories';

-- Should NOT include: name_translations, description_translations
-- Should include: slug
```

### Phase 2: Remove Translation Code

**Step 1: Delete Language Selector Component**
```bash
rm components/categories/language-selector.tsx
```

**Step 2: Update Type Definitions**
```typescript
// lib/types/core.ts
export interface Category {
  id: string;
  name: string; // Keep
  slug: string;
  parent_id: string | null;
  description: string | null;
  // Remove: name_translations, description_translations
  image_url: string | null;
  display_order: number;
  listing_count: number;
  created_at?: string;
  updated_at?: string;
}
```

**Step 3: Update Database Service**
```typescript
// lib/services/database.ts
function transformCategory(dbRecord: any): Category {
  return {
    id: dbRecord.id,
    name: dbRecord.name, // No translation lookup
    slug: dbRecord.slug || dbRecord.name.toLowerCase().replace(/\s+/g, '-'),
    parent_id: dbRecord.parent_id,
    description: dbRecord.description, // No translation lookup
    image_url: dbRecord.image_url,
    display_order: dbRecord.display_order,
    listing_count: dbRecord.listing_count || 0,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at
  };
}
```

**Step 4: Remove Language Params**
- Remove language parameter from URL state
- Remove language detection logic
- Update all category queries to exclude translation fields

### Phase 3: Implement New Components

**Order of Implementation:**
1. Shared components (Breadcrumb, LoadingSkeleton, EmptyState)
2. CategoryCard enhancements
3. CategorySearch and CategoryFilters
4. CategoryGrid
5. BrowsePage
6. SubcategoryCard and SubcategoryGrid
7. CategoryDetailPage

**Testing Between Steps:**
- Unit test each component before integration
- Verify accessibility with axe-core
- Visual regression tests

### Phase 4: Update Routes

**Step 1: Move `/browse` to Categories**
```bash
# Rename or create new browse page
mv app/(public)/browse/page.tsx app/(public)/browse/page.old.tsx
# Create new browse page
touch app/(public)/browse/page.tsx
```

**Step 2: Add Category Detail Route**
```bash
mkdir -p app/(main)/categories/[slug]
touch app/(main)/categories/[slug]/page.tsx
touch app/(main)/categories/[slug]/not-found.tsx
```

**Step 3: Add Footer to Pages**
```typescript
// Import Footer in both pages
import { Footer } from '@/components/layout/footer';

// Add at bottom of page JSX
<Footer />
```

### Phase 5: Testing and Validation

**Checklist:**
- [ ] All migrations applied successfully
- [ ] Translation columns removed from database
- [ ] Language Selector component deleted
- [ ] All imports of Language Selector removed
- [ ] Type definitions updated
- [ ] Database service updated
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Accessibility tests pass (WCAG 2.1 AA)
- [ ] Performance tests pass (Lighthouse > 90)
- [ ] Visual regression tests pass
- [ ] Manual testing on mobile, tablet, desktop
- [ ] Keyboard navigation works
- [ ] Screen reader testing complete

### Phase 6: Deployment

**Step 1: Deploy to Staging**
```bash
# Deploy to staging environment
vercel --env=staging

# Run smoke tests
npm run test:e2e:staging
```

**Step 2: Monitor Performance**
- Check Lighthouse scores
- Monitor error logs
- Verify real-time updates work

**Step 3: Deploy to Production**
```bash
# Deploy to production
vercel --prod

# Run smoke tests
npm run test:e2e:production
```

**Step 4: Post-Deployment Verification**
- [ ] Browse page loads correctly
- [ ] Category detail pages load correctly
- [ ] Search and filters work
- [ ] Navigation works
- [ ] Footer displays on all pages
- [ ] No console errors
- [ ] Performance metrics within targets

### Rollback Plan

**If Issues Occur:**

1. **Quick Rollback:**
   ```bash
   vercel rollback
   ```

2. **Database Rollback:**
   ```sql
   -- Re-add translation columns if needed
   ALTER TABLE categories ADD COLUMN name_translations JSONB DEFAULT '{}'::JSONB;
   ALTER TABLE categories ADD COLUMN description_translations JSONB DEFAULT '{}'::JSONB;
   ```

3. **Code Rollback:**
   - Revert to previous Git commit
   - Restore Language Selector component
   - Restore translation logic

## Dependencies and Tools

### Core Framework and Libraries

**Next.js 14:**
- Version: ^14.0.0
- Features Used: App Router, Server Components, ISR, Image Optimization
- Why: Latest stable version with full RSC support

**React 18:**
- Version: ^18.2.0
- Features Used: Server Components, Suspense, Transitions
- Why: Required for Next.js 14

**TypeScript:**
- Version: ^5.0.0
- Why: Type safety, better DX, catch errors at compile time

### UI and Animation

**Framer Motion:**
- Version: ^10.16.0
- Usage: Card animations, page transitions, hover effects
- Why: Performant, declarative animations with React integration

**Tailwind CSS:**
- Version: ^3.4.0
- Usage: Utility-first styling, responsive design
- Why: Fast development, consistent design system, excellent performance

**clsx / cn utility:**
- Version: ^2.0.0
- Usage: Conditional className composition
- Why: Clean, readable conditional styling

**Lucide React:**
- Version: ^0.294.0
- Usage: Icon library (Search, ChevronRight, etc.)
- Why: Modern, customizable, tree-shakeable icons

### Data and State Management

**Supabase JS Client:**
- Version: ^2.38.0
- Usage: Database queries, real-time subscriptions
- Why: PostgreSQL with real-time capabilities, great DX

**use-debounce:**
- Version: ^10.0.0
- Usage: Debounce search input
- Why: Simple, performant debouncing

**zustand (optional):**
- Version: ^4.4.0
- Usage: Client-side state management if needed
- Why: Lightweight, simple API, works with RSC

### Utility Libraries

**date-fns:**
- Version: ^3.0.0
- Usage: Date calculations for badges (isNew, isRecentlyUpdated)
- Why: Lightweight, modular, good TypeScript support

**floating-ui:**
- Version: ^1.5.0
- Usage: Position category preview popovers
- Why: Robust positioning, handles edge cases

### Testing

**Jest:**
- Version: ^29.7.0
- Usage: Unit tests
- Why: Standard React testing framework

**React Testing Library:**
- Version: ^14.1.0
- Usage: Component tests
- Why: Best practices for testing React components

**Playwright:**
- Version: ^1.40.0
- Usage: E2E and integration tests
- Why: Cross-browser, reliable, great debugging

**@axe-core/react:**
- Version: ^4.8.0
- Usage: Accessibility testing
- Why: Industry standard for a11y testing

**MSW (Mock Service Worker):**
- Version: ^2.0.0
- Usage: Mock Supabase API in tests
- Why: Realistic API mocking without backend

### Development Tools

**ESLint:**
- Version: ^8.54.0
- Plugins: eslint-plugin-react, eslint-plugin-jsx-a11y
- Why: Code quality, catch errors

**Prettier:**
- Version: ^3.1.0
- Why: Consistent code formatting

**Husky:**
- Version: ^8.0.0
- Usage: Git hooks for pre-commit checks
- Why: Prevent bad commits

**lint-staged:**
- Version: ^15.1.0
- Usage: Run linters on staged files
- Why: Fast pre-commit checks

### Performance Monitoring

**@vercel/analytics:**
- Version: ^1.1.0
- Usage: Web vitals tracking
- Why: Monitor real user metrics

**Lighthouse CI:**
- Version: ^0.12.0
- Usage: Automated performance testing
- Why: Ensure performance standards in CI/CD

### Installation Commands

```bash
# Core dependencies
npm install next@latest react@latest react-dom@latest typescript@latest

# UI and Animation
npm install framer-motion tailwindcss clsx lucide-react

# Data
npm install @supabase/supabase-js use-debounce

# Utilities
npm install date-fns @floating-ui/react

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint prettier eslint-config-next
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D @axe-core/react msw
npm install -D husky lint-staged
npm install -D @vercel/analytics lighthouse
```

## Accessibility Considerations

### WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Text: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio
- Test with: Chrome DevTools, WAVE, axe DevTools

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Logical tab order (search → filters → cards)
- Visible focus indicators (2px outline, primary-500 color)
- No keyboard traps
- Escape key closes popovers/modals

**Screen Reader Support:**
- Semantic HTML (nav, main, section, article)
- ARIA labels on icon buttons
- ARIA landmarks (role="navigation", role="main")
- Breadcrumb with aria-label="breadcrumb"
- Category cards with descriptive aria-label
- Live regions for dynamic updates (aria-live="polite")

**Visual Design:**
- Sufficient text size (minimum 16px body text)
- Line height 1.5 for readability
- Adequate spacing between interactive elements (minimum 44x44px touch targets on mobile)
- No information conveyed by color alone (use icons + text for badges)
- Support for prefers-reduced-motion

### Focus Management

**Focus Indicators:**
```css
.focusable:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
  border-radius: theme('borderRadius.lg');
}
```

**Skip Links:**
```typescript
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
>
  Skip to main content
</a>
```

**Focus Trap in Modals:**
```typescript
import { useFocusTrap } from '@/hooks/use-focus-trap';

function Modal() {
  const modalRef = useFocusTrap();
  return <div ref={modalRef}>...</div>;
}
```

### Alternative Text

**Image Alt Text Standards:**
```typescript
<Image
  src={category.image_url}
  alt={`${category.name} category with ${category.listing_count} listings`}
/>
```

**Decorative Images:**
```typescript
<Image src={decorativeImage} alt="" role="presentation" />
```

### ARIA Attributes

**Breadcrumb:**
```typescript
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Browse Categories</li>
  </ol>
</nav>
```

**Category Card:**
```typescript
<Link
  href={`/categories/${category.slug}`}
  aria-label={`Browse ${category.name} category with ${category.listing_count} listings`}
>
  <CategoryCard category={category} />
</Link>
```

**Search Input:**
```typescript
<label htmlFor="category-search" className="sr-only">
  Search categories
</label>
<input
  id="category-search"
  type="search"
  placeholder="Search categories..."
  aria-describedby="search-hint"
/>
<span id="search-hint" className="sr-only">
  Search by category name or description
</span>
```

### Testing Checklist

**Automated Tests:**
- [ ] axe-core scan passes with 0 violations
- [ ] Lighthouse accessibility score > 95
- [ ] Pa11y CI passes all checks

**Manual Tests:**
- [ ] Keyboard-only navigation works throughout
- [ ] Screen reader announces all important content (tested with NVDA/JAWS/VoiceOver)
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG standards
- [ ] Touch targets meet minimum size on mobile
- [ ] Reduced motion preferences respected
- [ ] Page structure makes sense without CSS

---

## Conclusion

This design document provides a comprehensive technical specification for transforming the `/browse` page into a rich categories browsing experience. The design emphasizes:

1. **Performance** - ISR, image optimization, code splitting, RSC
2. **Accessibility** - WCAG 2.1 Level AA compliance, keyboard navigation, screen reader support
3. **User Experience** - Smooth animations, responsive design, real-time updates
4. **Maintainability** - Type safety, modular components, clear separation of concerns
5. **Simplicity** - Removal of unused translation infrastructure

The implementation follows Next.js 14 best practices with Server Components for data fetching and Client Components for interactivity. The hierarchical category structure supports unlimited nesting depth, and real-time updates ensure data accuracy.

All requirements are addressed through a combination of property-based testing (for universal logic), integration testing (for external services), and example-based testing (for specific UI behaviors).
