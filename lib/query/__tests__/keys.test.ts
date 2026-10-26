/**
 * Query Keys Tests
 * 
 * Tests for hierarchical query key structure
 * Validates Requirement 29.2
 */

import { describe, it, expect } from 'vitest';
import { queryKeys } from '../keys';

describe('Query Keys', () => {
  describe('Hierarchical structure (Requirement 29.2)', () => {
    it('should have hierarchical listings keys', () => {
      expect(queryKeys.listings.all).toEqual(['listings']);
      expect(queryKeys.listings.featured()).toEqual(['listings', 'featured']);
      expect(queryKeys.listings.detail('123')).toEqual(['listings', 'detail', '123']);
      expect(queryKeys.listings.byCategory('cat-1')).toEqual(['listings', 'category', 'cat-1']);
      expect(queryKeys.listings.byVendor('vendor-1')).toEqual(['listings', 'vendor', 'vendor-1']);
    });
    
    it('should have hierarchical vendors keys', () => {
      expect(queryKeys.vendors.all).toEqual(['vendors']);
      expect(queryKeys.vendors.featured()).toEqual(['vendors', 'featured']);
      expect(queryKeys.vendors.detail('123')).toEqual(['vendors', 'detail', '123']);
    });
    
    it('should have hierarchical activities keys', () => {
      expect(queryKeys.activities.all).toEqual(['activities']);
      expect(queryKeys.activities.recent(20)).toEqual(['activities', 'recent', 20]);
    });
    
    it('should have hierarchical recommendations keys', () => {
      expect(queryKeys.recommendations.all).toEqual(['recommendations']);
      expect(queryKeys.recommendations.forUser('user-1')).toEqual(['recommendations', 'user', 'user-1']);
      expect(queryKeys.recommendations.trending()).toEqual(['recommendations', 'trending']);
    });
    
    it('should have hierarchical interactions keys', () => {
      expect(queryKeys.interactions.all).toEqual(['interactions']);
      expect(queryKeys.interactions.likes('user-1')).toEqual(['interactions', 'likes', 'user-1']);
      expect(queryKeys.interactions.saves('user-1')).toEqual(['interactions', 'saves', 'user-1']);
      expect(queryKeys.interactions.recentlyViewed('user-1')).toEqual(['interactions', 'viewed', 'user-1']);
    });
    
    it('should include filters in infinite query keys', () => {
      const filters = { category_id: 'cat-1', min_price: 100 };
      expect(queryKeys.listings.infinite(filters)).toEqual(['listings', 'infinite', filters]);
    });
    
    it('should include search query and filters in search keys', () => {
      const filters = { category_id: 'cat-1' };
      expect(queryKeys.listings.search('laptop', filters)).toEqual(['listings', 'search', 'laptop', filters]);
    });
  });
  
  describe('Key consistency', () => {
    it('should return the same key for the same inputs', () => {
      const key1 = queryKeys.listings.detail('123');
      const key2 = queryKeys.listings.detail('123');
      expect(key1).toEqual(key2);
    });
    
    it('should return different keys for different inputs', () => {
      const key1 = queryKeys.listings.detail('123');
      const key2 = queryKeys.listings.detail('456');
      expect(key1).not.toEqual(key2);
    });
    
    it('should handle undefined filters', () => {
      const key1 = queryKeys.listings.infinite();
      const key2 = queryKeys.listings.infinite(undefined);
      expect(key1).toEqual(key2);
    });
  });
});
