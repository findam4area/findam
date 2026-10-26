import { Metadata } from 'next';

/**
 * Homepage metadata configuration
 * Requirements: 20.1, 20.2, 20.3, 20.4, 28.1
 */
export const homepageMetadata: Metadata = {
  // Title tag (under 60 characters) - Requirement 20.1
  title: 'FindAm - Nigeria\'s #1 Youth Marketplace | Buy & Sell',
  
  // Meta description (under 160 characters) - Requirement 20.2
  description: 'Join 50,000+ Nigerians buying and selling on FindAm. AI-powered protection, verified sellers, instant chat. Start for free today!',
  
  // Keywords for SEO
  keywords: [
    'Nigeria marketplace',
    'buy and sell Nigeria',
    'online marketplace',
    'classified ads Nigeria',
    'verified sellers',
    'youth marketplace',
    'Lagos marketplace',
    'Abuja marketplace',
  ],
  
  // Authors
  authors: [{ name: 'FindAm' }],
  
  // Creator
  creator: 'FindAm',
  
  // Publisher
  publisher: 'FindAm',
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph tags for social sharing - Requirement 20.3
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://findam.ng',
    siteName: 'FindAm',
    title: 'FindAm - Nigeria\'s #1 Youth Marketplace',
    description: 'Join 50,000+ Nigerians buying and selling on FindAm. AI-powered protection, verified sellers, instant chat.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FindAm - Nigeria\'s #1 Youth Marketplace',
        type: 'image/png',
      },
    ],
  },
  
  // Twitter Card tags - Requirement 20.4
  twitter: {
    card: 'summary_large_image',
    site: '@FindAmNG',
    creator: '@FindAmNG',
    title: 'FindAm - Nigeria\'s #1 Youth Marketplace',
    description: 'Join 50,000+ Nigerians buying and selling on FindAm. AI-powered protection, verified sellers, instant chat.',
    images: ['/og-image.png'],
  },
  
  // Verification
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  
  // Alternate languages (if applicable)
  alternates: {
    canonical: 'https://findam.ng',
  },
  
  // Category
  category: 'marketplace',
};
