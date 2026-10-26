// Category Analytics types for Advanced Category Taxonomy System
// Requirements: 18.5

export interface CategoryAnalytics {
  id: string;
  category_id: string;

  // Metrics
  business_count: number;
  search_count: number;
  view_count: number;

  // Time period
  period_date: string; // ISO date string
  period_type: "daily" | "weekly" | "monthly";

  // Metadata
  created_at: string;
  updated_at: string;
}
