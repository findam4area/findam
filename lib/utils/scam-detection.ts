// ScamShield AI - Pattern detection for suspicious listings

import { Listing } from "@/lib/types";

export interface ScamDetectionResult {
  is_suspicious: boolean;
  confidence: number; // 0-1
  reasons: string[];
  flags: ScamFlag[];
}

export type ScamFlag =
  | "suspicious_keywords"
  | "price_anomaly"
  | "unrealistic_price"
  | "suspicious_contact"
  | "duplicate_content"
  | "too_good_to_be_true";

// Suspicious keywords that indicate potential scams
const SUSPICIOUS_KEYWORDS = [
  // Payment scams
  "wire transfer",
  "western union",
  "moneygram",
  "send money first",
  "pay upfront",
  "advance payment",
  "deposit first",
  "payment before delivery",

  // Too good to be true
  "100% guaranteed",
  "risk free",
  "no risk",
  "get rich quick",
  "make money fast",
  "limited time only",
  "act now",
  "urgent",

  // Contact scams
  "whatsapp only",
  "telegram only",
  "contact via email",
  "dm for details",

  // Suspicious phrases
  "brand new in box",
  "never used",
  "factory sealed",
  "original receipt",
  "warranty included",

  // Nigerian-specific scams
  "yahoo yahoo",
  "419",
  "format",
  "client",
];

// Price thresholds for different categories (in Naira)
const CATEGORY_PRICE_RANGES: Record<
  string,
  { min: number; max: number; average: number }
> = {
  // Electronics
  phones: { min: 20000, max: 1500000, average: 150000 },
  laptops: { min: 50000, max: 3000000, average: 300000 },
  tablets: { min: 30000, max: 800000, average: 150000 },

  // Vehicles
  cars: { min: 500000, max: 50000000, average: 3000000 },
  motorcycles: { min: 100000, max: 5000000, average: 500000 },

  // Real Estate
  apartments: { min: 5000000, max: 500000000, average: 30000000 },
  land: { min: 1000000, max: 1000000000, average: 10000000 },

  // Default for other categories
  default: { min: 1000, max: 10000000, average: 50000 },
};

/**
 * Detect suspicious keywords in listing content
 */
function detectSuspiciousKeywords(text: string): {
  found: boolean;
  keywords: string[];
} {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }

  return {
    found: foundKeywords.length > 0,
    keywords: foundKeywords,
  };
}

/**
 * Detect price anomalies
 */
function detectPriceAnomaly(
  price: number | undefined,
  categoryOrTitle: string,
): {
  is_anomaly: boolean;
  reason?: string;
} {
  if (!price || price <= 0) {
    return { is_anomaly: false };
  }

  // Infer category from title if needed
  let category = categoryOrTitle.toLowerCase();

  // Check for specific product mentions in title
  if (category.includes("iphone") || category.includes("phone")) {
    category = "phones";
  } else if (category.includes("laptop") || category.includes("macbook")) {
    category = "laptops";
  } else if (category.includes("car") || category.includes("vehicle")) {
    category = "cars";
  }

  // Get category price range
  const priceRange =
    CATEGORY_PRICE_RANGES[category] || CATEGORY_PRICE_RANGES.default;

  // Check if price is unrealistically low (less than or equal to minimum * 0.5)
  if (price <= priceRange.min * 0.5) {
    return {
      is_anomaly: true,
      reason: `Price (₦${price.toLocaleString()}) is unrealistically low`,
    };
  }

  // Check if price is suspiciously low (less than 30% of average)
  if (price < priceRange.average * 0.3) {
    return {
      is_anomaly: true,
      reason: `Price (₦${price.toLocaleString()}) is suspiciously low for this category (average: ₦${priceRange.average.toLocaleString()})`,
    };
  }

  // Check if price is suspiciously high (more than 3x max)
  if (price > priceRange.max * 3) {
    return {
      is_anomaly: true,
      reason: `Price (₦${price.toLocaleString()}) is suspiciously high`,
    };
  }

  return { is_anomaly: false };
}

/**
 * Detect suspicious contact information patterns
 */
function detectSuspiciousContact(text: string): {
  found: boolean;
  reasons: string[];
} {
  const lowerText = text.toLowerCase();
  const reasons: string[] = [];

  // Check for multiple phone numbers
  const phonePattern = /(\+?234|0)[0-9]{10}/g;
  const phones = text.match(phonePattern);
  if (phones && phones.length > 2) {
    reasons.push("Multiple phone numbers detected");
  }

  // Check for email addresses in description
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailPattern);
  if (emails && emails.length > 0) {
    reasons.push(
      "Email address in description (potential off-platform contact)",
    );
  }

  // Check for social media handles
  if (
    lowerText.includes("@") &&
    (lowerText.includes("instagram") ||
      lowerText.includes("twitter") ||
      lowerText.includes("facebook"))
  ) {
    reasons.push("Social media handles detected");
  }

  return {
    found: reasons.length > 0,
    reasons,
  };
}

/**
 * Detect duplicate or copied content
 */
function detectDuplicateContent(text: string): {
  is_duplicate: boolean;
  reason?: string;
} {
  // Check for excessive repetition
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = new Map<string, number>();

  for (const word of words) {
    if (word.length > 3) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  }

  // Check if any word appears more than 20% of the time
  const totalWords = words.length;
  for (const [word, count] of wordCount.entries()) {
    if (count / totalWords > 0.2) {
      return {
        is_duplicate: true,
        reason: `Excessive repetition of word "${word}"`,
      };
    }
  }

  // Check for very short descriptions (potential spam)
  if (text.trim().length < 20) {
    return {
      is_duplicate: true,
      reason: "Description too short (potential spam)",
    };
  }

  return { is_duplicate: false };
}

/**
 * Main scam detection function
 */
export function detectScamPatterns(listing: Listing): ScamDetectionResult {
  const reasons: string[] = [];
  const flags: ScamFlag[] = [];
  let suspicionScore = 0;

  // Combine title and description for analysis
  const fullText = `${listing.title} ${listing.description}`;

  // 1. Check for suspicious keywords
  const keywordCheck = detectSuspiciousKeywords(fullText);
  if (keywordCheck.found) {
    reasons.push(
      `Suspicious keywords detected: ${keywordCheck.keywords.join(", ")}`,
    );
    flags.push("suspicious_keywords");
    // Higher score for payment-related scam keywords
    const hasPaymentScam = keywordCheck.keywords.some(
      (k) =>
        k.includes("wire transfer") ||
        k.includes("send money") ||
        k.includes("western union") ||
        k.includes("moneygram") ||
        k.includes("pay upfront") ||
        k.includes("advance payment"),
    );
    suspicionScore += hasPaymentScam ? 0.6 : 0.4;
  }

  // 2. Check for price anomalies
  const priceCheck = detectPriceAnomaly(
    listing.price,
    listing.title || "default", // Use title to infer category if category name not available
  );
  if (priceCheck.is_anomaly) {
    reasons.push(priceCheck.reason!);
    if (priceCheck.reason?.includes("unrealistically")) {
      flags.push("unrealistic_price");
      suspicionScore += 0.6; // Increased from 0.5 to ensure detection
    } else {
      flags.push("price_anomaly");
      suspicionScore += 0.4; // Increased from 0.3
    }
  }

  // 3. Check for suspicious contact patterns
  const contactCheck = detectSuspiciousContact(fullText);
  if (contactCheck.found) {
    reasons.push(...contactCheck.reasons);
    flags.push("suspicious_contact");
    suspicionScore += 0.2;
  }

  // 4. Check for duplicate/spam content
  const duplicateCheck = detectDuplicateContent(fullText);
  if (duplicateCheck.is_duplicate) {
    reasons.push(duplicateCheck.reason!);
    flags.push("duplicate_content");
    suspicionScore += 0.3;
  }

  // 5. Check for "too good to be true" indicators
  if (
    listing.price &&
    listing.condition === "new" &&
    priceCheck.is_anomaly &&
    keywordCheck.found
  ) {
    reasons.push("Listing appears too good to be true");
    flags.push("too_good_to_be_true");
    suspicionScore += 0.4;
  }

  // Calculate final confidence (cap at 1.0)
  const confidence = Math.min(1.0, suspicionScore);

  // Consider suspicious if confidence > 0.5
  const is_suspicious = confidence > 0.5;

  return {
    is_suspicious,
    confidence,
    reasons,
    flags,
  };
}

/**
 * Get human-readable scam warning message
 */
export function getScamWarningMessage(result: ScamDetectionResult): string {
  if (!result.is_suspicious) {
    return "";
  }

  const confidence = Math.round(result.confidence * 100);

  if (confidence >= 80) {
    return "⚠️ HIGH RISK: This listing shows multiple signs of a potential scam. Exercise extreme caution.";
  } else if (confidence >= 60) {
    return "⚠️ MEDIUM RISK: This listing has some suspicious characteristics. Please verify carefully before proceeding.";
  } else {
    return "⚠️ LOW RISK: This listing has minor concerns. Please review the details carefully.";
  }
}

/**
 * Check if listing should be auto-flagged for admin review
 */
export function shouldAutoFlag(result: ScamDetectionResult): boolean {
  // Auto-flag if confidence is high or if critical flags are present
  return (
    result.confidence >= 0.7 ||
    result.flags.includes("unrealistic_price") ||
    result.flags.includes("too_good_to_be_true")
  );
}
