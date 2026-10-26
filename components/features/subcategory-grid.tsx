"use client";

/**
 * SubcategoryGrid Component
 * 
 * A client component that displays a grid of subcategories with:
 * - Responsive grid layout (2 cols mobile, 3 tablet, 4 desktop)
 * - SubcategoryCard components with staggered animations
 * - Section header with gradient underline
 * - Subcategory count display
 * - Real-time updates with Supabase subscriptions
 * 
 * Requirements: 16.6, 16.21, 16.22, 16.27
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types/core";
import { SubcategoryCard } from "@/components/features/subcategory-card";
import { EmptyState, EmptyStateVariants } from "@/components/shared/empty-state";

interface SubcategoryGridProps {
  /** Array of subcategories to display */
  subcategories: Category[];
  /** Parent category ID for real-time subscription */
  parentCategoryId?: string;
  /** Callback when a subcategory is selected */
  onSubcategorySelect?: (subcategory: Category) => void;
}

/**
 * Nested subcategory counts map
 * Maps parent subcategory ID to count of its children
 */
interface NestedSubcategoryCounts {
  [subcategoryId: string]: number;
}

export function SubcategoryGrid({ 
  subcategories, 
  parentCategoryId,
  onSubcategorySelect 
}: SubcategoryGridProps) {
  // Local state for subcategories to support real-time updates
  const [displaySubcategories, setDisplaySubcategories] = useState<Category[]>(subcategories);
  
  // State for nested subcategory counts
  const [nestedCounts, setNestedCounts] = useState<NestedSubcategoryCounts>({});
  
  // Supabase client for real-time subscriptions
  const supabase = createClient();

  // Update local state when props change
  useEffect(() => {
    setDisplaySubcategories(subcategories);
  }, [subcategories]);

  // Fetch nested subcategory counts for real-time display
  const fetchNestedCounts = useCallback(async () => {
    if (displaySubcategories.length === 0) return;
    
    const subcategoryIds = displaySubcategories.map(sub => sub.id);
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, parent_id')
      .in('parent_id', subcategoryIds);
    
    if (error) {
      console.error('Error fetching nested subcategory counts:', error);
      return;
    }
    
    // Count children per parent
    const counts: NestedSubcategoryCounts = {};
    data?.forEach((row) => {
      if (row.parent_id) {
        counts[row.parent_id] = (counts[row.parent_id] || 0) + 1;
      }
    });
    
    setNestedCounts(counts);
  }, [displaySubcategories, supabase]);

  // Fetch nested counts on mount and when subcategories change
  useEffect(() => {
    fetchNestedCounts();
  }, [fetchNestedCounts]);

  // Real-time subscription for listing count changes
  useEffect(() => {
    if (!parentCategoryId || subcategories.length === 0) return;

    // Subscribe to changes in the categories table where parent_id matches
    const channel = supabase
      .channel('subcategory-listing-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `parent_id=eq.${parentCategoryId}`,
        },
        (payload) => {
          // Handle UPDATE events (listing_count changes)
          if (payload.eventType === 'UPDATE') {
            const updatedCategory = payload.new as Category;
            
            setDisplaySubcategories(prev => 
              prev.map(sub => 
                sub.id === updatedCategory.id 
                  ? { ...sub, listing_count: updatedCategory.listing_count }
                  : sub
              )
            );
          }
          
          // Handle INSERT events (new subcategory added)
          if (payload.eventType === 'INSERT') {
            const newSubcategory = payload.new as Category;
            // Only add if it's a direct child of the parent category
            if (newSubcategory.parent_id === parentCategoryId) {
              setDisplaySubcategories(prev => [...prev, newSubcategory]);
              // Fetch updated nested counts for the new subcategory
              setTimeout(fetchNestedCounts, 100);
            }
          }
          
          // Handle DELETE events (subcategory removed)
          if (payload.eventType === 'DELETE') {
            const deletedSubcategory = payload.old as Category;
            setDisplaySubcategories(prev => 
              prev.filter(sub => sub.id !== deletedSubcategory.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentCategoryId, subcategories.length, supabase, fetchNestedCounts]);

  // Handle subcategory selection (for keyboard navigation)
  const handleKeyDown = (e: React.KeyboardEvent, subcategory: Category) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSubcategorySelect) {
        onSubcategorySelect(subcategory);
      }
    }
  };

  // If no subcategories, show empty state
  if (displaySubcategories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Section Header with gradient underline - Requirement 16.21 */}
      <div className="relative">
        <h2 className="text-2xl font-bold text-white">
          Explore Subcategories
        </h2>
        {/* Gradient underline */}
        <div className="absolute bottom-0 left-0 w-32 h-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" />
        
        {/* Subcategory count - Requirement 16.22 */}
        <p className="mt-2 text-sm text-gray-400">
          {displaySubcategories.length} {displaySubcategories.length === 1 ? 'subcategory' : 'subcategories'} available
        </p>
      </div>

      {/* Subcategories Grid - Requirement 16.6: Responsive grid (2 cols mobile, 3 tablet, 4 desktop) */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        role="list"
        aria-label="Subcategories grid"
      >
        {displaySubcategories.map((subcategory, index) => (
          <motion.div
            key={subcategory.id}
            role="listitem"
            onKeyDown={(e) => handleKeyDown(e, subcategory)}
          >
            <SubcategoryCard 
              subcategory={subcategory} 
              index={index}
              nestedSubcategoryCount={nestedCounts[subcategory.id] || 0}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}