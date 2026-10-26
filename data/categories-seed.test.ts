import { describe, it, expect } from 'vitest';
import { categoriesSeed, getTotalSubcategoryCount, validateCategorySeed, expectedSubcategoryCounts } from './categories-seed';

describe('Categories Seed Data', () => {
  it('should have exactly 23 main categories', () => {
    expect(categoriesSeed).toHaveLength(23);
  });

  it('should have correct total subcategory count', () => {
    const totalSubcategories = getTotalSubcategoryCount();
    // The sum of individual category counts is 335 (updated with new subcategories)
    expect(totalSubcategories).toBe(335);
  });

  it('should pass validation', () => {
    const validation = validateCategorySeed();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should have all required fields for each main category', () => {
    categoriesSeed.forEach(category => {
      expect(category.name).toBeTruthy();
      expect(category.description).toBeTruthy();
      expect(category.icon).toBeTruthy();
      expect(category.display_order).toBeGreaterThanOrEqual(1);
      expect(category.display_order).toBeLessThanOrEqual(23);
    });
  });

  it('should have unique display orders for main categories', () => {
    const displayOrders = categoriesSeed.map(c => c.display_order);
    const uniqueOrders = new Set(displayOrders);
    expect(uniqueOrders.size).toBe(categoriesSeed.length);
  });

  it('should have sequential display orders starting from 1', () => {
    const displayOrders = categoriesSeed.map(c => c.display_order).sort((a, b) => a - b);
    displayOrders.forEach((order, index) => {
      expect(order).toBe(index + 1);
    });
  });

  it('should have all required fields for each subcategory', () => {
    categoriesSeed.forEach(category => {
      if (category.subcategories) {
        category.subcategories.forEach(sub => {
          expect(sub.name).toBeTruthy();
          expect(sub.description).toBeTruthy();
          expect(sub.display_order).toBeGreaterThanOrEqual(1);
        });
      }
    });
  });

  it('should have unique display orders within each category for subcategories', () => {
    categoriesSeed.forEach(category => {
      if (category.subcategories) {
        const subOrders = category.subcategories.map(s => s.display_order);
        const uniqueSubOrders = new Set(subOrders);
        expect(uniqueSubOrders.size).toBe(subOrders.length);
      }
    });
  });

  it('should match expected subcategory counts per category', () => {
    categoriesSeed.forEach(category => {
      const actualCount = category.subcategories?.length || 0;
      const expectedCount = expectedSubcategoryCounts[category.name];
      expect(actualCount).toBe(expectedCount);
    });
  });

  it('should only use English (no multilingual fields)', () => {
    categoriesSeed.forEach(category => {
      // Verify no translation fields are present
      expect(category).not.toHaveProperty('name_translations');
      expect(category).not.toHaveProperty('description_translations');
      
      if (category.subcategories) {
        category.subcategories.forEach(sub => {
          expect(sub).not.toHaveProperty('name_translations');
          expect(sub).not.toHaveProperty('description_translations');
        });
      }
    });
  });

  it('should have valid Lucide React icon names', () => {
    // Common Lucide icons used in the seed data
    const validIcons = [
      'Home', 'Heart', 'ShoppingBag', 'GraduationCap', 'UtensilsCrossed',
      'Banknote', 'Monitor', 'Briefcase', 'Car', 'Plane', 'Sparkles',
      'Wheat', 'Zap', 'Factory', 'Radio', 'Truck', 'Building2',
      'Calendar', 'Palette', 'Baby', 'Dog', 'MoreHorizontal'
    ];
    
    categoriesSeed.forEach(category => {
      expect(validIcons).toContain(category.icon);
    });
  });
});
