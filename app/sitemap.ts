import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

/**
 * Dynamic Sitemap Generation
 * Requirements: 20.9, 28.2, 28.4
 * 
 * Generates a sitemap including all listings, categories, and vendor profiles
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://findam.ng';
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/premium`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // Fetch active listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(10000); // Limit to prevent sitemap from being too large

    const listingPages: MetadataRoute.Sitemap = (listings || []).map((listing) => ({
      url: `${baseUrl}/listing/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Fetch categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false });

    const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch vendor profiles (users with listings)
    const { data: vendors } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .gt('listing_count', 0)
      .order('updated_at', { ascending: false })
      .limit(5000);

    const vendorPages: MetadataRoute.Sitemap = (vendors || []).map((vendor) => ({
      url: `${baseUrl}/store/${vendor.id}`,
      lastModified: vendor.updated_at ? new Date(vendor.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...listingPages, ...categoryPages, ...vendorPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages if database query fails
    return staticPages;
  }
}
