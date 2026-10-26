// Category type for Advanced Category Taxonomy System
// Updated to remove multi-language translation support
// Requirements: 17.14, 17.15

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  parent_id?: string | null;
  display_order: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  // Populated in hierarchical queries
  subcategories?: Category[];
  business_count?: number; // For display in UI
}

// Business Category Tag type for multi-category tagging
// Requirements: 2.2, 2.3
export interface BusinessCategoryTag {
  id: string;
  business_profile_id: string;
  category_id: string;
  subcategory_ids: string[];
  is_primary: boolean; // Distinguishes primary from secondary categories
  created_at: string;
  // Relations (populated in queries)
  category?: Category;
}
