import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData, BreadcrumbStructuredData } from '../structured-data';

/**
 * Structured Data Component Tests
 * Requirements: 20.5, 28.3, 28.6
 * 
 * Tests for JSON-LD structured data generation
 */

describe('StructuredData Component', () => {
  describe('Homepage Structured Data', () => {
    it('should render Organization schema', () => {
      const { container } = render(<StructuredData type="homepage" />);
      const script = container.querySelector('script[type="application/ld+json"]');
      
      expect(script).toBeTruthy();
      
      const data = JSON.parse(script?.textContent || '{}');
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@graph']).toBeDefined();
      
      // Find Organization schema
      const orgSchema = data['@graph'].find((item: any) => item['@type'] === 'Organization');
      expect(orgSchema).toBeDefined();
      expect(orgSchema.name).toBe('FindAm');
      expect(orgSchema.url).toBe('https://findam.ng');
      expect(orgSchema.logo).toBeDefined();
      expect(orgSchema.sameAs).toBeInstanceOf(Array);
      expect(orgSchema.contactPoint).toBeDefined();
    });

    it('should render WebSite schema with search action', () => {
      const { container } = render(<StructuredData type="homepage" />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const data = JSON.parse(script?.textContent || '{}');
      
      // Find WebSite schema
      const websiteSchema = data['@graph'].find((item: any) => item['@type'] === 'WebSite');
      expect(websiteSchema).toBeDefined();
      expect(websiteSchema.name).toBe('FindAm');
      expect(websiteSchema.potentialAction).toBeDefined();
      expect(websiteSchema.potentialAction['@type']).toBe('SearchAction');
      expect(websiteSchema.potentialAction.target).toBeDefined();
      expect(websiteSchema.potentialAction['query-input']).toBe('required name=search_term_string');
    });

    it('should render LocalBusiness schema', () => {
      const { container } = render(<StructuredData type="homepage" />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const data = JSON.parse(script?.textContent || '{}');
      
      // Find LocalBusiness schema
      const businessSchema = data['@graph'].find((item: any) => item['@type'] === 'LocalBusiness');
      expect(businessSchema).toBeDefined();
      expect(businessSchema.name).toBe('FindAm');
      expect(businessSchema.address).toBeDefined();
      expect(businessSchema.address['@type']).toBe('PostalAddress');
      expect(businessSchema.address.addressCountry).toBe('NG');
      expect(businessSchema.geo).toBeDefined();
      expect(businessSchema.geo['@type']).toBe('GeoCoordinates');
      expect(businessSchema.openingHoursSpecification).toBeDefined();
      expect(businessSchema.aggregateRating).toBeDefined();
    });
  });

  describe('Listing Structured Data', () => {
    it('should render Product schema for listing', () => {
      const listingData = {
        title: 'iPhone 15 Pro',
        description: 'Brand new iPhone 15 Pro',
        images: ['https://example.com/image1.jpg'],
        price: 850000,
        currency: 'NGN',
        is_active: true,
        vendor: {
          name: 'TechStore Lagos',
        },
        rating: 4.8,
        review_count: 120,
      };

      const { container } = render(<StructuredData type="listing" data={listingData} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const data = JSON.parse(script?.textContent || '{}');
      
      expect(data['@type']).toBe('Product');
      expect(data.name).toBe('iPhone 15 Pro');
      expect(data.description).toBe('Brand new iPhone 15 Pro');
      expect(data.offers).toBeDefined();
      expect(data.offers['@type']).toBe('Offer');
      expect(data.offers.price).toBe(850000);
      expect(data.offers.priceCurrency).toBe('NGN');
      expect(data.offers.availability).toBe('https://schema.org/InStock');
      expect(data.aggregateRating).toBeDefined();
      expect(data.aggregateRating.ratingValue).toBe(4.8);
    });

    it('should return null for listing without data', () => {
      const { container } = render(<StructuredData type="listing" />);
      const script = container.querySelector('script[type="application/ld+json"]');
      
      expect(script).toBeNull();
    });
  });

  describe('Vendor Structured Data', () => {
    it('should render LocalBusiness schema for vendor', () => {
      const vendorData = {
        name: 'TechStore Lagos',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Leading electronics seller in Lagos',
        rating: 4.9,
        review_count: 500,
      };

      const { container } = render(<StructuredData type="vendor" data={vendorData} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const data = JSON.parse(script?.textContent || '{}');
      
      expect(data['@type']).toBe('LocalBusiness');
      expect(data.name).toBe('TechStore Lagos');
      expect(data.image).toBe('https://example.com/avatar.jpg');
      expect(data.description).toBe('Leading electronics seller in Lagos');
      expect(data.aggregateRating).toBeDefined();
      expect(data.aggregateRating.ratingValue).toBe(4.9);
    });
  });

  describe('Category Structured Data', () => {
    it('should render CollectionPage schema for category', () => {
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics',
      };

      const { container } = render(<StructuredData type="category" data={categoryData} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const data = JSON.parse(script?.textContent || '{}');
      
      expect(data['@type']).toBe('CollectionPage');
      expect(data.name).toBe('Electronics');
      expect(data.description).toContain('Electronics');
      expect(data.url).toBe('https://findam.ng/categories/electronics');
    });
  });
});

describe('BreadcrumbStructuredData Component', () => {
  it('should render BreadcrumbList schema', () => {
    const items = [
      { name: 'Home', url: '/' },
      { name: 'Electronics', url: '/categories/electronics' },
      { name: 'Smartphones', url: '/categories/electronics/smartphones' },
    ];

    const { container } = render(<BreadcrumbStructuredData items={items} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent || '{}');
    
    expect(data['@type']).toBe('BreadcrumbList');
    expect(data.itemListElement).toHaveLength(3);
    
    // Check first item
    expect(data.itemListElement[0]['@type']).toBe('ListItem');
    expect(data.itemListElement[0].position).toBe(1);
    expect(data.itemListElement[0].name).toBe('Home');
    expect(data.itemListElement[0].item).toBe('https://findam.ng/');
    
    // Check last item
    expect(data.itemListElement[2].position).toBe(3);
    expect(data.itemListElement[2].name).toBe('Smartphones');
  });

  it('should handle absolute URLs', () => {
    const items = [
      { name: 'Home', url: 'https://findam.ng/' },
      { name: 'About', url: 'https://findam.ng/about' },
    ];

    const { container } = render(<BreadcrumbStructuredData items={items} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent || '{}');
    
    expect(data.itemListElement[0].item).toBe('https://findam.ng/');
    expect(data.itemListElement[1].item).toBe('https://findam.ng/about');
  });
});
