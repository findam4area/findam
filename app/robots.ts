import { MetadataRoute } from 'next';

/**
 * Robots.txt Generation
 * Requirements: 20.10, 28.8
 * 
 * Generates robots.txt with proper crawl directives and sitemap references
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://findam.ng';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/private/',
          '/*.json$',
          '/auth/callback',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
