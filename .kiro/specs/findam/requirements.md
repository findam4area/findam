# Requirements Document: FindAm

## Introduction

FindAm is a premium, youth-centered, highly addictive multipurpose marketplace platform for Nigeria that combines Facebook Marketplace + Jiji + Instagram Reels discovery experience. The platform targets Nigerian youth (18-40) who love smooth, beautiful, social-style scrolling, serving buyers, sellers/individuals, and business owners. The experience feels like Instagram met Jiji met Mapbox—mobile-first, fast on low bandwidth, and deeply localized for Nigeria.

### Core Vision

- **Target Audience**: Nigerian youth (18-40) who love smooth, beautiful, social-style scrolling
- **User Types**: Buyers, Sellers/Individuals, Business Owners
- **Experience**: Instagram met Jiji met Mapbox
- **Design Philosophy**: Mobile-first, fast on low bandwidth, deeply localized for Nigeria

### Technology Stack

- **Frontend**: Next.js 15+ (App Router, React 19, TypeScript strict mode)
- **Backend**: Supabase (Auth with email/phone OTP/Google OAuth, Postgres, Storage, Realtime, PostGIS, Edge Functions, RLS)
- **UI/Styling**: shadcn/ui + Tailwind CSS 4 + Tailwind Merge + clsx + cva
- **State Management**: Zustand (global state) + TanStack React Query (infinite scroll feeds & caching)
- **Animation**: Framer Motion
- **Forms**: react-hook-form + Zod
- **Notifications**: Sonner (toasts)
- **Date Handling**: date-fns
- **Payments**: Paystack (primary payment for NGN)
- **Icons**: lucide-react
- **Theming**: next-themes (dark/light mode)
- **Maps**: react-leaflet + mapbox + Mapbox GL + react-map-gl
- **Monitoring**: Sentry
- **Email**: Resend + React Email
- **Realtime Chat**: Supabase Realtime + Twilio (SMS OTP)
- **Search**: Meilisearch
- **CDN**: Cloudinary + next-cloudinary

### Nigerian Localization (CRITICAL)

- All prices formatted as ₦ with numeral.js (e.g., ₦1,500,000)
- Phone numbers: +234 format with libphonenumber-js validation
- States/LGAs from nigeria-states-lgas package
- WhatsApp CTA links
- Categories with Nigerian context (Electronics, Fashion, Food, Real Estate, Vehicles, Services, Jobs, Agriculture, Beauty, Education, Events, Home)

### Design Colors

- **Primary**: #00C853 (Naira Green)
- **Secondary**: #15A3C7 Cyan Blue
- **Accent**: #FF9900 Market Orange
- **Typography**: Syne (display), DM Sans (body), JetBrains Mono (prices)

## Glossary

- **FindAm_Platform**: The complete web application system including frontend, backend, and database
- **User**: Any registered individual using the platform (buyers, sellers, service providers, business owners)
- **Listing**: A posted item, service, business entry, or classified ad in the marketplace
- **Boost**: A paid feature that promotes a listing to the "For You" feed
- **Trust_Score**: A numerical rating (0-100) indicating user verification, trustworthiness and reliability
- **Story**: A 24-hour disappearing video and image post feature
- **For_You_Feed**: The main discovery feed showing personalized listings with infinite scroll
- **Verification_Badge**: Visual indicator of user identity verification level (three variants)
- **Admin**: Platform administrator with content moderation and management privileges
- **Supabase**: Backend-as-a-Service providing database, authentication, storage, and realtime features
- **Paystack**: Payment gateway for Nigerian Naira transactions
- **ScamShield_AI**: Automated system for detecting suspicious listings
- **RLS**: Row Level Security - Supabase database security policies
- **LGA**: Local Government Area - Nigerian administrative division
- **Ward**: Smallest administrative unit in Nigerian local government
- **Cloudinary**: CDN service for optimized image and video delivery
- **Meilisearch**: Fast, typo-tolerant search engine
- **Escrow**: Payment held for 48 hours after delivery confirmation
- **Business_Directory**: Verified business listings with enhanced profiles
- **Portfolio**: Collection of work samples for service providers
- **Realtime_Chat**: In-app messaging using Supabase Realtime subscriptions

## Requirements

### Requirement 1: User Authentication and Registration

**User Story:** As a new user, I want to create an account and log in securely using email, phone OTP, or Google OAuth, so that I can access the platform and manage my listings.

#### Acceptance Criteria

1. WHEN a user submits valid registration information (email, password, username, phone), THE FindAm_Platform SHALL create a new user account via Supabase Auth
2. WHEN a user attempts to register with an existing email or username, THE FindAm_Platform SHALL reject the registration and display an appropriate error message
3. WHEN a user submits valid login credentials, THE FindAm_Platform SHALL authenticate the user and establish a session
4. WHEN a user requests Google OAuth authentication, THE FindAm_Platform SHALL redirect to the OAuth provider and complete authentication upon callback
5. WHEN a user requests phone OTP authentication, THE FindAm_Platform SHALL send an OTP via Twilio SMS to the provided +234 phone number
6. WHEN a user's password fails to meet security requirements (minimum 8 characters), THE FindAm_Platform SHALL reject the registration and display validation errors using Zod
7. WHEN a user successfully registers, THE FindAm_Platform SHALL send a verification email via Resend to confirm the email address
8. WHEN a user logs out, THE FindAm_Platform SHALL terminate the session and clear authentication tokens
9. THE FindAm_Platform SHALL validate all phone numbers against Nigerian +234 format using libphonenumber-js
10. THE FindAm_Platform SHALL rate limit OTP requests to prevent abuse (max 3 per hour per phone number)

### Requirement 2: User Profile Management

**User Story:** As a registered user, I want to manage my profile information and display my reputation, so that other users can trust and connect with me.

#### Acceptance Criteria

1. WHEN a user accesses their profile page, THE FindAm_Platform SHALL display username, avatar, bio, contact information, social links, active listings count, reviews, and Trust_Score
2. WHEN a user uploads a profile avatar, THE FindAm_Platform SHALL store the image in Supabase Storage and serve it via Cloudinary with next-cloudinary optimization
3. WHEN a user updates profile information (bio, contact, social links), THE FindAm_Platform SHALL validate using Zod schemas and persist the changes to the database
4. WHEN a user completes phone verification via Twilio OTP, THE FindAm_Platform SHALL increase their Trust_Score and display a verification badge
5. WHEN a user completes NIN and video verification, THE FindAm_Platform SHALL award a "100% Trusted" badge and set Trust_Score to 100
6. WHEN viewing another user's profile, THE FindAm_Platform SHALL display their public information, active listings, and review history
7. WHERE a user has a premium account, THE FindAm_Platform SHALL display a gold premium badge on their profile
8. THE FindAm_Platform SHALL hide phone numbers from public view and only reveal them to verified users who click "Tap to Reveal"
9. THE FindAm_Platform SHALL format all phone numbers as +234 format using libphonenumber-js

### Requirement 3: Listing Creation and Management

**User Story:** As a seller or service provider, I want to create and manage listings with rich media and location data, so that I can showcase my offerings effectively to Nigerian buyers.

#### Acceptance Criteria

1. WHEN a user creates a new listing, THE FindAm_Platform SHALL guide them through a multi-step form using react-hook-form (category, details, media, location)
2. WHEN a user uploads images or videos for a listing, THE FindAm_Platform SHALL store the media in Supabase Storage and serve via Cloudinary with next-cloudinary optimization
3. WHEN a user uploads a video exceeding 30 seconds, THE FindAm_Platform SHALL reject the upload and display a duration limit error
4. WHEN a user submits a listing without phone verification, THE FindAm_Platform SHALL prevent publication and prompt for Twilio OTP verification
5. WHEN a free-tier user attempts to create more than 10 active listings, THE FindAm_Platform SHALL prevent creation and suggest upgrading to premium
6. WHEN a user publishes a listing, THE FindAm_Platform SHALL generate a thumbnail from uploaded media using Cloudinary and make the listing visible in search and feeds
7. WHEN a user edits an existing listing, THE FindAm_Platform SHALL update the listing data while preserving the creation timestamp
8. WHEN a user deletes a listing, THE FindAm_Platform SHALL mark it as inactive and remove it from public visibility
9. WHEN a listing contains video, THE FindAm_Platform SHALL generate a thumbnail via Cloudinary and enable auto-play preview in feeds
10. THE FindAm_Platform SHALL require selection of Nigerian State → LGA → Ward for all listings using nigeria-states-lgas package
11. THE FindAm_Platform SHALL format all listing prices as ₦ with numeral.js (e.g., ₦1,500,000)
12. THE FindAm_Platform SHALL validate all form inputs using Zod schemas
13. THE FindAm_Platform SHALL sanitize all user-generated text with dompurify to prevent XSS attacks
14. WHEN a listing price exceeds ₦50,000,000, THE FindAm_Platform SHALL flag it for admin review
15. THE FindAm_Platform SHALL rate limit listing creation to max 10 listings per day per user

### Requirement 4: Discovery Feed and Content Display

**User Story:** As a user, I want to discover listings through an engaging, personalized feed with infinite scroll, so that I can find relevant items and services quickly.

#### Acceptance Criteria

1. WHEN a user accesses the For_You_Feed, THE FindAm_Platform SHALL display a vertical scrolling feed using TanStack React Query for infinite scroll
2. WHEN a user scrolls through the feed, THE FindAm_Platform SHALL load additional listings infinitely using cursor-based pagination
3. WHEN a listing card appears in the viewport, THE FindAm_Platform SHALL auto-play video previews with muted audio using Intersection Observer
4. WHEN a user hovers over a listing card, THE FindAm_Platform SHALL apply 3D tilt animation effects using Framer Motion
5. WHEN a user swipes up on a listing card, THE FindAm_Platform SHALL open a full-detail modal with parallax scrolling
6. WHERE a listing is boosted, THE FindAm_Platform SHALL display a glowing "Boosted" indicator on the card
7. WHEN a user views the trending carousel, THE FindAm_Platform SHALL display horizontally scrolling cards with infinite loop animation
8. WHEN a user pulls down on the feed, THE FindAm_Platform SHALL trigger a refresh with neon ripple animation
9. THE FindAm_Platform SHALL display all prices as ₦ formatted with numeral.js
10. THE FindAm_Platform SHALL serve all images via Cloudinary with next-cloudinary optimization
11. THE FindAm_Platform SHALL implement skeleton screens while content loads
12. THE FindAm_Platform SHALL cache feed data using TanStack React Query with stale-while-revalidate strategy

### Requirement 5: Search and Filtering with Meilisearch

**User Story:** As a user, I want to search and filter listings by various criteria including location (State/LGA/Ward), so that I can find exactly what I'm looking for in my area.

#### Acceptance Criteria

1. WHEN a user types in the search bar, THE FindAm_Platform SHALL display autocomplete suggestions using Meilisearch with typo tolerance
2. WHEN a user submits a search query, THE FindAm_Platform SHALL return relevant listings from Meilisearch matching the query text
3. WHEN a user applies category filters, THE FindAm_Platform SHALL display only listings within the selected categories
4. WHEN a user applies price range filters, THE FindAm_Platform SHALL display only listings within the specified ₦ price bounds
5. WHEN a user applies location filters (State → LGA → Ward), THE FindAm_Platform SHALL display only listings from the selected Nigerian locations using nigeria-states-lgas data
6. WHEN a user applies condition filters (new/used), THE FindAm_Platform SHALL display only listings matching the condition
7. WHEN a user selects a sort option (price, date, relevance), THE FindAm_Platform SHALL reorder results accordingly
8. WHEN a user performs a search, THE FindAm_Platform SHALL store the query in recent searches using localStorage for quick access
9. THE FindAm_Platform SHALL format all search result prices as ₦ with numeral.js
10. THE FindAm_Platform SHALL sync Supabase database changes to Meilisearch index in real-time
11. THE FindAm_Platform SHALL implement search result caching using TanStack React Query

### Requirement 6: Real-Time Messaging with Supabase Realtime

**User Story:** As a user, I want to communicate with sellers and buyers in real-time using in-app chat, so that I can negotiate and arrange transactions safely.

#### Acceptance Criteria

1. WHEN a user initiates a conversation, THE FindAm_Platform SHALL create a chat channel via Supabase Realtime subscriptions
2. WHEN a user sends a message, THE FindAm_Platform SHALL deliver it to the recipient in real-time using Supabase Realtime
3. WHEN a user is typing, THE FindAm_Platform SHALL display a typing indicator to the other participant using Supabase broadcast
4. WHEN a user receives a message, THE FindAm_Platform SHALL mark it as unread until viewed and show unread badge
5. WHEN a user views a message, THE FindAm_Platform SHALL send a read receipt to the sender
6. WHEN a user shares an image in chat, THE FindAm_Platform SHALL upload it to Supabase Storage, serve via Cloudinary, and display it inline
7. WHEN a user views their message list, THE FindAm_Platform SHALL display all conversations with unread badges and online status indicators using Supabase presence
8. WHEN a conversation contains suspicious content, THE FindAm_Platform SHALL display scam protection warnings
9. THE FindAm_Platform SHALL sanitize all message content with dompurify
10. THE FindAm_Platform SHALL hide phone numbers in messages until user clicks "Tap to Reveal"
11. THE FindAm_Platform SHALL format any phone numbers in messages as +234 format using libphonenumber-js

### Requirement 7: Safety and Anti-Fraud System

**User Story:** As a user, I want to interact on a safe platform with verified users and fraud detection, so that I can avoid scams and fraudulent activities.

#### Acceptance Criteria

1. WHEN a user attempts to create a listing without phone verification, THE FindAm_Platform SHALL require Twilio OTP verification before allowing publication
2. WHEN a user completes NIN verification with selfie and video, THE FindAm_Platform SHALL award the "100% Trusted" badge
3. WHEN a listing displays phone numbers, THE FindAm_Platform SHALL hide them behind a "Tap to Reveal" button accessible only to verified users
4. WHEN a user reveals a phone number, THE FindAm_Platform SHALL log the action and limit reveals to prevent abuse (max 20 per day)
5. WHEN a user opens a listing detail page, THE FindAm_Platform SHALL display safety tips prominently
6. WHEN a user reports a listing, THE FindAm_Platform SHALL immediately hide it from public view and queue it for admin review
7. WHEN ScamShield_AI detects suspicious patterns (unrealistic prices, stolen images, suspicious keywords), THE FindAm_Platform SHALL flag the listing for review
8. WHEN a chat conversation is initiated, THE FindAm_Platform SHALL display "Meet in public" safety suggestions
9. THE FindAm_Platform SHALL scan all uploaded images for NSFW content before publication
10. THE FindAm_Platform SHALL sanitize all user-generated content with dompurify
11. THE FindAm_Platform SHALL implement rate limiting on all API endpoints to prevent abuse

### Requirement 8: Payment and Monetization with Paystack

**User Story:** As a user, I want to boost my listings and access premium features through secure Paystack payments in Nigerian Naira, so that I can increase my visibility and capabilities.

#### Acceptance Criteria

1. WHEN a user selects the boost option for a listing, THE FindAm_Platform SHALL initiate a Paystack payment for ₦500
2. WHEN a Paystack payment is successful, THE FindAm_Platform SHALL mark the listing as boosted and display it in the For_You_Feed
3. WHEN a user subscribes to premium (₦5,999/month), THE FindAm_Platform SHALL process payment via Paystack and activate premium features
4. WHERE a user has a premium account, THE FindAm_Platform SHALL allow 30 active listings per month
5. WHERE a user has a premium account, THE FindAm_Platform SHALL display analytics for their listings
6. WHERE a user has a premium account, THE FindAm_Platform SHALL display a gold verification badge
7. WHEN a payment fails, THE FindAm_Platform SHALL display an error message using Sonner toast and allow retry
8. WHEN a premium subscription expires, THE FindAm_Platform SHALL downgrade the account to free tier
9. THE FindAm_Platform SHALL verify all Paystack webhook signatures using crypto HMAC SHA512
10. WHEN a Paystack webhook receives 'charge.success', THE FindAm_Platform SHALL update transaction status to 'escrow'
11. WHEN a Paystack webhook receives 'transfer.success', THE FindAm_Platform SHALL update transaction status to 'released'
12. THE FindAm_Platform SHALL hold escrow payments for 48 hours after delivery confirmation
13. THE FindAm_Platform SHALL format all payment amounts as ₦ with numeral.js

### Requirement 9: Stories Feature

**User Story:** As a user, I want to post temporary video stories, so that I can share time-sensitive offers and updates.

#### Acceptance Criteria

1. WHEN a user creates a story, THE FindAm_Platform SHALL accept video uploads up to 30 seconds stored in Supabase Storage
2. WHEN a story is published, THE FindAm_Platform SHALL make it visible to all users for 24 hours
3. WHEN 24 hours elapse after story publication, THE FindAm_Platform SHALL automatically delete the story using Supabase Edge Functions
4. WHEN a user views stories, THE FindAm_Platform SHALL display them in a full-screen vertical format with Framer Motion animations
5. WHEN a user taps on a story, THE FindAm_Platform SHALL advance to the next story
6. WHERE a user has a premium account, THE FindAm_Platform SHALL allow featured story slots with priority placement
7. THE FindAm_Platform SHALL serve all story videos via Cloudinary with next-cloudinary optimization
8. THE FindAm_Platform SHALL generate thumbnails for story videos using Cloudinary

### Requirement 10: Admin Dashboard and Moderation

**User Story:** As an admin, I want to monitor platform activity and moderate content, so that I can maintain quality and safety standards.

#### Acceptance Criteria

1. WHEN an admin accesses the dashboard, THE FindAm_Platform SHALL display user growth metrics, active listings count, and engagement statistics
2. WHEN an admin views reported listings, THE FindAm_Platform SHALL display all flagged content with report reasons
3. WHEN an admin approves a reported listing, THE FindAm_Platform SHALL restore it to public visibility
4. WHEN an admin removes a listing, THE FindAm_Platform SHALL permanently delete it and notify the user via email using Resend
5. WHEN an admin views user management, THE FindAm_Platform SHALL display all users with filtering and search capabilities
6. WHEN an admin suspends a user account, THE FindAm_Platform SHALL prevent login and hide all their listings
7. WHEN an admin views analytics, THE FindAm_Platform SHALL display popular categories, conversion rates, and engagement trends
8. THE FindAm_Platform SHALL implement role-based access control (RBAC) using Supabase RLS policies for admin routes
9. THE FindAm_Platform SHALL log all admin actions for audit trail

### Requirement 11: Notifications System with Supabase Realtime

**User Story:** As a user, I want to receive real-time notifications about relevant activities, so that I can stay informed and engaged.

#### Acceptance Criteria

1. WHEN a new listing matching user interests is posted, THE FindAm_Platform SHALL send a real-time notification via Supabase Realtime
2. WHEN a user receives a new message, THE FindAm_Platform SHALL send a notification with message preview using Sonner toast
3. WHEN a user's listing receives a like or save, THE FindAm_Platform SHALL send a notification
4. WHEN a user's boost expires, THE FindAm_Platform SHALL send a notification with renewal option
5. WHEN a user's premium subscription is about to expire, THE FindAm_Platform SHALL send a reminder notification via email using Resend
6. WHEN a user enables notification preferences, THE FindAm_Platform SHALL respect their settings for each notification type stored in Supabase
7. THE FindAm_Platform SHALL display unread notification count in the navbar
8. THE FindAm_Platform SHALL use Supabase Realtime subscriptions for instant notification delivery

### Requirement 12: Performance and Optimization

**User Story:** As a user, I want the platform to load quickly and respond smoothly even on low bandwidth, so that I have an enjoyable browsing experience.

#### Acceptance Criteria

1. WHEN a user navigates to any page, THE FindAm_Platform SHALL display skeleton screens while content loads
2. WHEN images are displayed, THE FindAm_Platform SHALL use next-cloudinary with lazy loading and WebP format
3. WHEN a user scrolls through feeds, THE FindAm_Platform SHALL implement infinite scroll with TanStack React Query virtualization for performance
4. WHEN JavaScript bundles are loaded, THE FindAm_Platform SHALL use code splitting and dynamic imports to minimize initial load time
5. WHEN static content is requested, THE FindAm_Platform SHALL serve pre-rendered pages via Next.js ISR (Incremental Static Regeneration)
6. WHEN database queries are executed, THE FindAm_Platform SHALL implement caching strategies using TanStack React Query to reduce response times
7. WHEN a user accesses the platform on mobile, THE FindAm_Platform SHALL deliver optimized assets and responsive layouts
8. THE FindAm_Platform SHALL compress all images via Cloudinary with next-cloudinary
9. THE FindAm_Platform SHALL implement Supabase connection pooling for database performance
10. THE FindAm_Platform SHALL use Supabase PostGIS indexes for location-based queries

### Requirement 13: Mobile-First Experience

**User Story:** As a mobile user, I want a native-feeling app experience, so that I can use the platform comfortably on my phone.

#### Acceptance Criteria

1. WHEN a user accesses the platform on mobile, THE FindAm_Platform SHALL display a bottom navigation bar with primary actions
2. WHEN a user pulls down on any scrollable content, THE FindAm_Platform SHALL trigger pull-to-refresh functionality
3. WHEN a user swipes on listing cards, THE FindAm_Platform SHALL respond with appropriate gesture actions using Framer Motion
4. WHEN interactive elements are displayed, THE FindAm_Platform SHALL ensure minimum touch target size of 44px
5. WHEN a user performs actions, THE FindAm_Platform SHALL provide haptic feedback animations using Framer Motion
6. WHEN a user installs the PWA, THE FindAm_Platform SHALL function offline with cached content and sync when online
7. WHEN the platform is accessed on different screen sizes, THE FindAm_Platform SHALL adapt layouts responsively using Tailwind CSS 4
8. THE FindAm_Platform SHALL use next-themes for dark/light mode with dark mode as default

### Requirement 14: Category System

**User Story:** As a user, I want to browse listings by specific Nigerian-relevant categories and subcategories, so that I can find relevant items efficiently.

#### Acceptance Criteria

1. WHEN a user views the category list, THE FindAm_Platform SHALL display all 12 main categories (Electronics, Fashion, Food, Real Estate, Vehicles, Services, Jobs, Agriculture, Beauty, Education, Events, Home) with custom lucide-react icons
2. WHEN a user selects a main category, THE FindAm_Platform SHALL display all associated subcategories
3. WHEN a user selects a subcategory, THE FindAm_Platform SHALL display only listings within that subcategory using Meilisearch
4. WHEN a user creates a listing, THE FindAm_Platform SHALL require selection of both main category and subcategory validated with Zod
5. WHEN category data is stored, THE FindAm_Platform SHALL maintain hierarchical relationships between main categories and subcategories in Supabase

### Requirement 15: User Interaction Features

**User Story:** As a user, I want to interact with listings through likes, saves, and shares, so that I can curate and share content.

#### Acceptance Criteria

1. WHEN a user likes a listing, THE FindAm_Platform SHALL increment the like count with optimistic UI updates using TanStack React Query and store the user's like action in Supabase
2. WHEN a user saves a listing, THE FindAm_Platform SHALL add it to their saved items collection in Supabase
3. WHEN a user shares a listing, THE FindAm_Platform SHALL generate a shareable link with Open Graph metadata and WhatsApp share option
4. WHEN a user views their saved listings, THE FindAm_Platform SHALL display all items they have saved
5. WHEN a user unlikes or unsaves a listing, THE FindAm_Platform SHALL remove the action and update counts with optimistic UI
6. THE FindAm_Platform SHALL use Framer Motion animations for like/save button interactions

### Requirement 16: Review and Rating System

**User Story:** As a user, I want to leave reviews for sellers and service providers, so that I can help others make informed decisions.

#### Acceptance Criteria

1. WHEN a user submits a review, THE FindAm_Platform SHALL store the rating (1-5 stars) and review text in Supabase validated with Zod
2. WHEN a user views a profile, THE FindAm_Platform SHALL display all reviews with average rating
3. WHEN a user attempts to review without completing a transaction, THE FindAm_Platform SHALL prevent the review submission
4. WHEN a review is submitted, THE FindAm_Platform SHALL update the reviewed user's Trust_Score calculation
5. WHEN a user edits their review, THE FindAm_Platform SHALL update the review content and recalculate ratings
6. THE FindAm_Platform SHALL sanitize all review text with dompurify

### Requirement 17: Design System and Visual Effects

**User Story:** As a user, I want a visually stunning and engaging interface with Nigerian-inspired colors, so that I enjoy using the platform.

#### Acceptance Criteria

1. WHEN any page loads, THE FindAm_Platform SHALL apply dark mode with neon accents (Naira green #00C853, orange, cyan) using Tailwind CSS 4
2. WHEN glassmorphism effects are rendered, THE FindAm_Platform SHALL apply backdrop blur with transparency using Tailwind CSS 4
3. WHEN a user completes a successful action, THE FindAm_Platform SHALL display sparkle animations using Framer Motion
4. WHEN the hero section is displayed, THE FindAm_Platform SHALL show animated shooting stars in the background
5. WHEN interactive elements are hovered, THE FindAm_Platform SHALL apply micro-interactions with Framer Motion spring physics
6. WHEN navigation is displayed, THE FindAm_Platform SHALL use floating dock component with smooth animations
7. WHEN scroll behavior is active, THE FindAm_Platform SHALL use smooth scrolling effects
8. THE FindAm_Platform SHALL use Syne font for display text, DM Sans for body text, and JetBrains Mono for prices
9. THE FindAm_Platform SHALL use shadcn/ui components styled with Tailwind CSS 4, clsx, cva, and tailwind-merge

### Requirement 18: Location-Based Features with Nigerian Data

**User Story:** As a user, I want to filter and search by Nigerian locations (State → LGA → Ward), so that I can find local offerings near me.

#### Acceptance Criteria

1. WHEN a user creates a listing, THE FindAm_Platform SHALL require selection of Nigerian State → LGA → Ward using nigeria-states-lgas package
2. WHEN a user filters by location, THE FindAm_Platform SHALL display all Nigerian states with their LGAs and wards
3. WHEN a user searches with location filters, THE FindAm_Platform SHALL return only listings from selected locations using Supabase PostGIS queries
4. WHEN a listing is displayed, THE FindAm_Platform SHALL show the state and LGA location prominently
5. THE FindAm_Platform SHALL use Mapbox GL with react-map-gl to display listing locations on interactive maps
6. THE FindAm_Platform SHALL use react-leaflet for location picker during listing creation
7. THE FindAm_Platform SHALL store location coordinates in Supabase using PostGIS extension
8. THE FindAm_Platform SHALL implement "Nearby" feed showing listings within user's location radius

### Requirement 19: Portfolio and Service Provider Features

**User Story:** As a service provider, I want to showcase my work through a portfolio, so that potential clients can evaluate my skills.

#### Acceptance Criteria

1. WHERE a user is a service provider, THE FindAm_Platform SHALL display a portfolio grid on their profile
2. WHEN a service provider uploads portfolio items, THE FindAm_Platform SHALL store them in Supabase Storage, serve via Cloudinary, and display them in a grid layout
3. WHERE a user is a job seeker, THE FindAm_Platform SHALL allow CV upload to Supabase Storage and skills listing
4. WHEN a portfolio item is clicked, THE FindAm_Platform SHALL display it in a full-screen modal with details
5. THE FindAm_Platform SHALL use Framer Motion for portfolio grid animations

### Requirement 20: Data Persistence and State Management

**User Story:** As a user, I want my data and preferences to persist across sessions, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN a user logs in, THE FindAm_Platform SHALL restore their saved listings, preferences, and session state from Supabase
2. WHEN a user's session expires, THE FindAm_Platform SHALL prompt for re-authentication using Supabase Auth
3. WHEN data is modified, THE FindAm_Platform SHALL persist changes to Supabase database immediately
4. WHEN a user accesses the platform offline (PWA), THE FindAm_Platform SHALL display cached content and queue actions for sync
5. WHEN network connectivity is restored, THE FindAm_Platform SHALL sync queued actions with Supabase server
6. THE FindAm_Platform SHALL use Zustand for global state management
7. THE FindAm_Platform SHALL use TanStack React Query for server state caching and synchronization

### Requirement 21: Business Directory and Verified Businesses

**User Story:** As a business owner, I want to create a verified business profile with enhanced features, so that I can build trust and attract more customers.

#### Acceptance Criteria

1. WHEN a business owner creates a business profile, THE FindAm_Platform SHALL store business information (name, description, category, location, contact) in Supabase
2. WHEN a business completes verification (business registration documents), THE FindAm_Platform SHALL award a "Verified Business" badge
3. WHEN a user views the business directory, THE FindAm_Platform SHALL display all verified businesses with filtering by category and location
4. WHERE a business has a verified profile, THE FindAm_Platform SHALL display enhanced profile with portfolio, reviews, and contact options
5. THE FindAm_Platform SHALL allow businesses to post multiple listings linked to their business profile
6. THE FindAm_Platform SHALL format all business contact numbers as +234 format using libphonenumber-js

### Requirement 22: Database Schema and RLS Policies

**User Story:** As a platform administrator, I want a secure and well-structured database with Row Level Security, so that user data is protected.

#### Acceptance Criteria

1. THE FindAm_Platform SHALL enable PostGIS and pg_trgm extensions in Supabase for location and search features
2. THE FindAm_Platform SHALL create tables: profiles, categories, businesses, listings, conversations, conversation_participants, messages, stories, reviews, user_likes, user_saves, notifications, payments, reports, promotions, portfolio_items
3. THE FindAm_Platform SHALL implement RLS policies on all tables to ensure users can only access their own data
4. THE FindAm_Platform SHALL create indexes on listings table for: state, category, seller, status, created_at, coordinates, search
5. THE FindAm_Platform SHALL create Supabase Storage buckets: avatars, listing-media, story-videos, portfolio with appropriate size limits and RLS policies
6. THE FindAm_Platform SHALL use typed Supabase client for all database calls with TypeScript strict mode

### Requirement 23: API Routes and Server Actions

**User Story:** As a developer, I want well-structured API routes with rate limiting and validation, so that the platform is secure and performant.

#### Acceptance Criteria

1. THE FindAm_Platform SHALL implement Next.js API routes for: listings, search, upload, webhooks/paystack
2. THE FindAm_Platform SHALL implement Server Actions for: createListing, updateListing, deleteListing, markAsSold, boostListing, initializePayment, verifyPayment, releaseEscrow, initiateRefund, updateProfile, verifyPhoneOTP, upgradeToSeller, createReview
3. THE FindAm_Platform SHALL validate all API inputs using Zod schemas
4. THE FindAm_Platform SHALL sanitize all user inputs with dompurify
5. THE FindAm_Platform SHALL implement rate limiting on all API routes
6. THE FindAm_Platform SHALL use Supabase Edge Functions for scheduled tasks (story deletion, subscription expiration)

### Requirement 24: Core Pages and Routing

**User Story:** As a user, I want to navigate through well-organized pages with smooth transitions, so that I can easily access all platform features.

#### Acceptance Criteria

1. THE FindAm_Platform SHALL implement the following core pages using Next.js 15 App Router:
   - Landing / Home Page (/)
   - Discovery Feed (/feed) with infinite scroll using TanStack Query
   - Listing Detail (/listings/[slug])
   - Search Results (/search) powered by Meilisearch
   - Business Profile (/businesses/[slug])
   - Post Listing (/listings/new) with multi-step form
   - Inbox / Chat (/messages) with Supabase Realtime
   - Seller Dashboard (/dashboard)
   - User Profile (/profile/[username])
   - Auth Flow (/login, /register, /verify)
2. THE FindAm_Platform SHALL use route groups for layout organization: (auth), (main), (seller), (admin)
3. THE FindAm_Platform SHALL implement page transitions using Framer Motion
4. THE FindAm_Platform SHALL use Next.js middleware for authentication checks and redirects
5. THE FindAm_Platform SHALL implement SEO-friendly metadata for all pages

### Requirement 25: Key Components Architecture

**User Story:** As a developer, I want reusable, well-structured components, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. THE FindAm_Platform SHALL implement the following key components:
   - `<ListingCard />` - Most-used component with Cloudinary optimization and Framer Motion animations
   - `<ReactionBar />` - Like/save/share with optimistic UI using TanStack React Query
   - `<ChatWindow />` - Supabase Realtime subscription for messages
   - `<PaystackButton />` - react-paystack wrapper for payments
   - `<LocationPicker />` - Nigeria states/LGAs/wards with MapBox using react-map-gl
   - `<VerifiedBadge />` - Three variants (phone verified, NIN verified, business verified)
   - `<FeedScroll />` - Infinite scroll with TanStack React Query virtualization
   - `<SearchBar />` - Meilisearch-powered autocomplete
   - `<CategoryGrid />` - Nigerian categories with lucide-react icons
   - `<PriceDisplay />` - ₦ formatted with numeral.js using JetBrains Mono font
2. THE FindAm_Platform SHALL use shadcn/ui as base component library styled with Tailwind CSS 4
3. THE FindAm_Platform SHALL implement all forms using react-hook-form + Zod validation
4. THE FindAm_Platform SHALL use Sonner for toast notifications
5. THE FindAm_Platform SHALL use Framer Motion for all animations

### Requirement 26: Trust & Safety Rules

**User Story:** As a platform administrator, I want automated safety rules to protect users, so that fraudulent activity is minimized.

#### Acceptance Criteria

1. WHEN a listing price exceeds ₦50,000,000, THE FindAm_Platform SHALL flag it for admin review
2. THE FindAm_Platform SHALL rate limit listing creation to max 10 listings per day per user
3. THE FindAm_Platform SHALL sanitize all user-generated text with dompurify
4. THE FindAm_Platform SHALL require phone verification before posting first listing
5. THE FindAm_Platform SHALL scan uploaded images for NSFW content
6. WHEN an escrow payment is initiated, THE FindAm_Platform SHALL hold funds for 48 hours after delivery confirmation
7. THE FindAm_Platform SHALL hide phone numbers from public view and only reveal to verified users
8. THE FindAm_Platform SHALL rate limit phone number reveals to max 20 per day per user

### Requirement 27: File Structure and Organization

**User Story:** As a developer, I want a well-organized file structure, so that the codebase is easy to navigate and maintain.

#### Acceptance Criteria

1. THE FindAm_Platform SHALL organize files according to the following structure:

```
src/
├── app/
│   ├── (auth)/                 # Auth group: login, register, verify
│   ├── (main)/                 # Main layout: feed, search, messages
│   │   ├── feed/               # Discovery feed
│   │   ├── listings/[slug]/    # Listing detail
│   │   ├── businesses/[slug]/  # Business profile
│   │   ├── messages/           # Chat inbox
│   │   ├── profile/[username]/ # User profile
│   │   └── search/             # Search results
│   ├── (seller)/               # Seller dashboard
│   │   ├── dashboard/
│   │   ├── listings/new/
│   │   └── analytics/
│   ├── (admin)/                # Admin panel (role-gated)
│   └── api/                    # API Route Handlers
│       ├── webhooks/paystack/
│       ├── search/
│       └── upload/
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── listings/               # ListingCard, ListingGrid, ListingForm
│   ├── businesses/             # BusinessCard, BusinessProfile
│   ├── feed/                   # FeedItem, FeedScroll, Stories
│   ├── chat/                   # ChatWindow, MessageBubble, OfferCard
│   ├── maps/                   # MapView, LocationPicker
│   ├── payments/               # PaystackButton, EscrowStatus
│   └── shared/                 # Navbar, Footer, Avatar, Rating
├── lib/
│   ├── supabase/               # client.ts, server.ts, middleware.ts
│   ├── paystack/               # init.ts, webhook.ts, escrow.ts
│   ├── cloudinary/             # upload.ts, transform.ts
│   ├── meilisearch/            # client.ts, sync.ts, queries.ts
│   ├── validations/            # zod schemas for all forms
│   └── utils/                  # formatNGN, formatPhone, slugify
├── hooks/                      # useAuth, useListings, useChat, useSearch
├── stores/                     # Zustand stores: authStore, cartStore
├── types/                      # Global TypeScript interfaces
└── styles/                     # globals.css, fonts
```

### Requirement 28: Error Handling and Monitoring

**User Story:** As a user, I want clear error messages and reliable error tracking, so that issues are quickly identified and resolved.

#### Acceptance Criteria

1. THE FindAm_Platform SHALL implement error boundaries for all major sections
2. THE FindAm_Platform SHALL use Sonner toast notifications for user-facing errors
3. THE FindAm_Platform SHALL integrate Sentry for error tracking and monitoring
4. THE FindAm_Platform SHALL log all API errors with context for debugging
5. THE FindAm_Platform SHALL display user-friendly error messages for common scenarios (network errors, validation errors, authentication errors)
6. THE FindAm_Platform SHALL implement retry logic for failed API requests using TanStack React Query
