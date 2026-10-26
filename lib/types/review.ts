// Business Review types for Advanced Category Taxonomy System
// Requirements: 18.1, 18.4

import { User } from "./index";

export interface BusinessReview {
  id: string;
  business_profile_id: string;
  reviewer_id: string;

  // Review content
  rating: number; // 1-5
  comment: string;

  // Business owner response
  owner_response?: string;
  responded_at?: string;

  // Moderation
  is_flagged: boolean;
  flagged_reason?: string;
  flagged_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations (populated in queries)
  reviewer?: User;
}
