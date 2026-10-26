// Nigerian States with major areas
export const NIGERIAN_STATES = [
  {
    name: "Lagos",
    areas: [
      "Ikeja",
      "Victoria Island",
      "Lekki",
      "Ikoyi",
      "Surulere",
      "Yaba",
      "Ajah",
      "Maryland",
      "Festac",
      "Apapa",
    ],
  },
  {
    name: "Abuja (FCT)",
    areas: [
      "Wuse",
      "Maitama",
      "Garki",
      "Asokoro",
      "Gwarinpa",
      "Kubwa",
      "Lugbe",
      "Jabi",
      "Utako",
      "Karu",
    ],
  },
  {
    name: "Rivers",
    areas: [
      "Port Harcourt",
      "Obio-Akpor",
      "Eleme",
      "Okrika",
      "Bonny",
      "Degema",
      "Oyigbo",
      "Ikwerre",
    ],
  },
  {
    name: "Kano",
    areas: [
      "Kano Municipal",
      "Nassarawa",
      "Fagge",
      "Dala",
      "Gwale",
      "Tarauni",
      "Kumbotso",
      "Ungogo",
    ],
  },
  {
    name: "Oyo",
    areas: [
      "Ibadan North",
      "Ibadan South-West",
      "Ibadan North-East",
      "Ibadan South-East",
      "Ibadan North-West",
      "Ogbomoso",
      "Oyo",
    ],
  },
  {
    name: "Kaduna",
    areas: [
      "Kaduna North",
      "Kaduna South",
      "Chikun",
      "Zaria",
      "Sabon Gari",
      "Igabi",
      "Kajuru",
    ],
  },
  {
    name: "Enugu",
    areas: [
      "Enugu North",
      "Enugu South",
      "Enugu East",
      "Nsukka",
      "Udi",
      "Nkanu",
      "Awgu",
    ],
  },
] as const;

// Categories with icons
export const CATEGORIES = [
  { name: "Electronics", icon: "📱", slug: "electronics" },
  { name: "Fashion", icon: "👗", slug: "fashion" },
  { name: "Vehicles", icon: "🚗", slug: "vehicles" },
  { name: "Property", icon: "🏠", slug: "property" },
  { name: "Services", icon: "🔧", slug: "services" },
  { name: "Jobs", icon: "💼", slug: "jobs" },
  { name: "Home & Garden", icon: "🛋️", slug: "home-garden" },
  { name: "Health & Beauty", icon: "💄", slug: "health-beauty" },
  { name: "Sports & Outdoors", icon: "⚽", slug: "sports-outdoors" },
  { name: "Babies & Kids", icon: "👶", slug: "babies-kids" },
  { name: "Agriculture", icon: "🌾", slug: "agriculture" },
] as const;

// Pricing
export const PRICING = {
  BOOST_PRICE: 500, // NGN
  PREMIUM_MONTHLY: 5999, // NGN
  FREE_LISTING_LIMIT: 3,
  PREMIUM_LISTING_LIMIT: 30,
} as const;

// Media constraints
export const MEDIA_CONSTRAINTS = {
  MAX_VIDEO_DURATION: 30, // seconds
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4"],
} as const;

// Trust Score thresholds
export const TRUST_SCORE = {
  PHONE_VERIFIED: 30,
  NIN_VERIFIED: 50,
  VIDEO_VERIFIED: 20,
  TRUSTED_BADGE_THRESHOLD: 100,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Story duration
export const STORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting
export const RATE_LIMITS = {
  PHONE_REVEAL_PER_DAY: 10,
  OTP_REQUESTS_PER_HOUR: 3,
  MESSAGE_PER_MINUTE: 10,
} as const;

// Supabase Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  LISTING_MEDIA: "listing-media",
  STORY_VIDEOS: "story-videos",
  PORTFOLIO: "portfolio",
} as const;

// App routes
export const ROUTES = {
  HOME: "/",
  FEED: "/feed",
  SEARCH: "/search",
  MESSAGES: "/messages",
  PROFILE: "/profile",
  LISTING_CREATE: "/listing/create",
  LISTING_DETAIL: "/listing",
  STORIES: "/stories",
  ADMIN: "/admin",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

// Listing conditions
export const LISTING_CONDITIONS = ["new", "used", "refurbished"] as const;

// Sort options for search results
export const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Most Relevant" },
] as const;

// Price range presets for quick filtering
export const PRICE_RANGES = [
  { label: "Under ₦10,000", min: 0, max: 10000 },
  { label: "₦10,000 - ₦50,000", min: 10000, max: 50000 },
  { label: "₦50,000 - ₦100,000", min: 50000, max: 100000 },
  { label: "₦100,000 - ₦500,000", min: 100000, max: 500000 },
  { label: "Above ₦500,000", min: 500000, max: undefined },
] as const;
