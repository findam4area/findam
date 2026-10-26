/**
 * EmptyState Component Usage Examples
 * 
 * This file demonstrates various ways to use the EmptyState component
 * in different scenarios throughout the application.
 */

import { EmptyState, EmptyStateVariants } from "./empty-state";
import { Search, Package, AlertCircle, Inbox } from "lucide-react";

// ============================================================================
// Example 1: Basic Empty State with Custom Content
// ============================================================================

export function BasicEmptyStateExample() {
  return (
    <EmptyState
      title="No Categories Available"
      message="Categories will appear here once they're added."
    />
  );
}

// ============================================================================
// Example 2: Empty State with Custom Icon
// ============================================================================

export function CustomIconExample() {
  return (
    <EmptyState
      title="Inbox Empty"
      message="You're all caught up! No new messages."
      icon={<Inbox className="w-12 h-12 text-gray-400" aria-hidden="true" />}
    />
  );
}

// ============================================================================
// Example 3: Empty State with Action Button
// ============================================================================

export function EmptyStateWithActionExample() {
  const handleClearFilters = () => {
    console.log("Clearing filters...");
    // Reset filter state here
  };

  return (
    <EmptyState
      title="No Matches Found"
      message="No categories match your current filters. Try adjusting them."
      icon={<Package className="w-12 h-12 text-gray-400" aria-hidden="true" />}
      action={{
        label: "Clear Filters",
        onClick: handleClearFilters,
      }}
    />
  );
}

// ============================================================================
// Example 4: Search Results Empty State (Using Variant)
// ============================================================================

export function SearchResultsExample() {
  const handleClearSearch = () => {
    console.log("Clearing search...");
    // Reset search query here
  };

  return (
    <EmptyStateVariants.NoSearchResults
      searchTerm="electronics"
      onClear={handleClearSearch}
    />
  );
}

// ============================================================================
// Example 5: Filter Results Empty State (Using Variant)
// ============================================================================

export function FilterResultsExample() {
  const handleClearFilters = () => {
    console.log("Clearing filters...");
    // Reset all filters here
  };

  return <EmptyStateVariants.NoFilterResults onClear={handleClearFilters} />;
}

// ============================================================================
// Example 6: Generic No Data State (Using Variant)
// ============================================================================

export function NoDataExample() {
  return <EmptyStateVariants.NoData entityName="categories" />;
}

// ============================================================================
// Example 7: Error State with Retry (Using Variant)
// ============================================================================

export function ErrorStateExample() {
  const handleRetry = async () => {
    console.log("Retrying...");
    // Refetch data here
  };

  return <EmptyStateVariants.Error onRetry={handleRetry} />;
}

// ============================================================================
// Example 8: Error State without Retry (Using Variant)
// ============================================================================

export function ErrorStateWithoutRetryExample() {
  return <EmptyStateVariants.Error />;
}

// ============================================================================
// Example 9: Custom Styling
// ============================================================================

export function CustomStyledExample() {
  const handleCreateCategory = () => {
    console.log("Creating new category...");
    // Navigate to create category page
  };

  return (
    <EmptyState
      title="Start Building Your Categories"
      message="Create your first category to get started organizing your marketplace."
      icon={<Package className="w-16 h-16 text-primary-400" aria-hidden="true" />}
      action={{
        label: "Create Category",
        onClick: handleCreateCategory,
      }}
      className="bg-gradient-to-b from-transparent to-primary-900/10"
    />
  );
}

// ============================================================================
// Example 10: Conditional Empty State in Component
// ============================================================================

export function CategoryListExample({ categories }: { categories: any[] }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hasFilters, setHasFilters] = React.useState(false);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setHasFilters(false);
  };

  if (categories.length === 0) {
    // No categories in database at all
    return <EmptyStateVariants.NoData entityName="categories" />;
  }

  if (filteredCategories.length === 0 && searchQuery) {
    // Search returned no results
    return (
      <EmptyStateVariants.NoSearchResults
        searchTerm={searchQuery}
        onClear={handleClearSearch}
      />
    );
  }

  if (filteredCategories.length === 0 && hasFilters) {
    // Filters applied but no results
    return <EmptyStateVariants.NoFilterResults onClear={handleClearFilters} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCategories.map((category) => (
        <div key={category.id}>{category.name}</div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 11: Error Boundary Integration
// ============================================================================

export function ErrorBoundaryExample() {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (hasError) {
    return <EmptyStateVariants.Error onRetry={fetchData} />;
  }

  if (data.length === 0) {
    return <EmptyStateVariants.NoData entityName="categories" />;
  }

  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

// Note: This example file is for documentation purposes only.
// It demonstrates various usage patterns but should not be imported in production code.
