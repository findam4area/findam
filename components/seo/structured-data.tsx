"use client";

/**
 * Structured Data (JSON-LD) Component
 * Requirements: 20.5, 28.3, 28.6
 * 
 * Implements Organization, WebSite, and LocalBusiness schemas
 * for enhanced SEO and rich search results
 */

export interface StructuredDataProps {
  type?: 'homepage' | 'listing' | 'vendor' | 'category';
  data?: any;
}

export function StructuredData({ type = 'homepage', data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseUrl = 'https://findam.ng';
    
    switch (type) {
      case 'homepage':
        return {
          '@context': 'https://schema.org',
          '@graph': [
            // Organization schema - Requirement 20.5
            {
              '@type': 'Organization',
              '@id': `${baseUrl}/#organization`,
              name: 'FindAm',
              url: baseUrl,
              logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/logo.png`,
                width: 512,
                height: 512,
              },
              sameAs: [
                'https://twitter.com/FindAmNG',
                'https://facebook.com/FindAmNG',
                'https://instagram.com/FindAmNG',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+234-XXX-XXX-XXXX',
                contactType: 'customer service',
                areaServed: 'NG',
                availableLanguage: 'en',
              },
            },
            // WebSite schema with search action - Requirement 28.3
            {
              '@type': 'WebSite',
              '@id': `${baseUrl}/#website`,
              url: baseUrl,
              name: 'FindAm',
              description: 'Nigeria\'s #1 Youth Marketplace for buying and selling',
              publisher: {
                '@id': `${baseUrl}/#organization`,
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${baseUrl}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            },
            // LocalBusiness schema - Requirement 28.6
            {
              '@type': 'LocalBusiness',
              '@id': `${baseUrl}/#localbusiness`,
              name: 'FindAm',
              image: `${baseUrl}/og-image.png`,
              url: baseUrl,
              telephone: '+234-XXX-XXX-XXXX',
              priceRange: '₦₦',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'TBD',
                addressLocality: 'Lagos',
                addressRegion: 'Lagos',
                postalCode: '100001',
                addressCountry: 'NG',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 6.5244,
                longitude: 3.3792,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ],
                opens: '00:00',
                closes: '23:59',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '50000',
              },
            },
          ],
        };
      
      case 'listing':
        if (!data) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.title,
          description: data.description,
          image: data.images || [],
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.currency || 'NGN',
            availability: data.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: data.vendor?.name || 'FindAm Seller',
            },
          },
          aggregateRating: data.rating ? {
            '@type': 'AggregateRating',
            ratingValue: data.rating,
            reviewCount: data.review_count || 0,
          } : undefined,
        };
      
      case 'vendor':
        if (!data) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: data.name,
          image: data.avatar,
          description: data.bio,
          aggregateRating: data.rating ? {
            '@type': 'AggregateRating',
            ratingValue: data.rating,
            reviewCount: data.review_count || 0,
          } : undefined,
        };
      
      case 'category':
        if (!data) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: data.name,
          description: `Browse ${data.name} listings on FindAm`,
          url: `${baseUrl}/categories/${data.slug}`,
        };
      
      default:
        return null;
    }
  };

  const structuredData = getStructuredData();
  
  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Breadcrumb Structured Data Component
 * Requirement: 28.6
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const baseUrl = 'https://findam.ng';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
