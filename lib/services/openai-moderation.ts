/**
 * OpenAI Moderation Service
 *
 * Provides AI-powered content moderation using OpenAI's Moderation API.
 * Supports text and image content scanning for prohibited content.
 *
 * Requirements: 6.1 (AI Content Moderation)
 * Task: 8.3
 */

import OpenAI from "openai";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Moderation category types from OpenAI
 */
export interface ModerationCategories {
  hate: boolean;
  "hate/threatening": boolean;
  harassment: boolean;
  "harassment/threatening": boolean;
  "self-harm": boolean;
  "self-harm/intent": boolean;
  "self-harm/instructions": boolean;
  sexual: boolean;
  "sexual/minors": boolean;
  violence: boolean;
  "violence/graphic": boolean;
}

/**
 * Moderation category scores (0-1)
 */
export interface ModerationCategoryScores {
  hate: number;
  "hate/threatening": number;
  harassment: number;
  "harassment/threatening": number;
  "self-harm": number;
  "self-harm/intent": number;
  "self-harm/instructions": number;
  sexual: number;
  "sexual/minors": number;
  violence: number;
  "violence/graphic": number;
}

/**
 * OpenAI moderation result
 */
export interface OpenAIModerationResult {
  flagged: boolean;
  categories: ModerationCategories;
  category_scores: ModerationCategoryScores;
}

/**
 * Violation object for database storage
 */
export interface Violation {
  type: string;
  severity: "low" | "medium" | "high";
  details: string;
  confidence: number;
}

/**
 * Moderation scan result
 */
export interface ModerationScanResult {
  approved: boolean;
  confidence: number;
  action: "approve" | "flag" | "reject";
  violations: Violation[];
}

/**
 * Scan text content using OpenAI Moderation API
 *
 * @param text - Text content to scan (title, description, etc.)
 * @returns Moderation result with violations
 */
export async function scanTextContent(
  text: string,
): Promise<ModerationScanResult> {
  try {
    const client = getOpenAIClient();

    // Call OpenAI Moderation API
    const response = await client.moderations.create({
      input: text,
    });

    const result = response.results[0];

    // Convert OpenAI result to our format
    return convertOpenAIResult(result);
  } catch (error) {
    console.error("OpenAI moderation error:", error);

    // On error, default to flagging for manual review
    return {
      approved: false,
      confidence: 50,
      action: "flag",
      violations: [
        {
          type: "scan_error",
          severity: "medium",
          details: "Unable to complete automated scan. Manual review required.",
          confidence: 50,
        },
      ],
    };
  }
}

/**
 * Scan multiple text fields (title, description, etc.)
 *
 * @param fields - Object with text fields to scan
 * @returns Combined moderation result
 */
export async function scanMultipleFields(
  fields: Record<string, string>,
): Promise<ModerationScanResult> {
  try {
    // Combine all fields into a single text for scanning
    const combinedText = Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n\n");

    return await scanTextContent(combinedText);
  } catch (error) {
    console.error("Multi-field moderation error:", error);

    return {
      approved: false,
      confidence: 50,
      action: "flag",
      violations: [
        {
          type: "scan_error",
          severity: "medium",
          details: "Unable to complete automated scan. Manual review required.",
          confidence: 50,
        },
      ],
    };
  }
}

/**
 * Convert OpenAI moderation result to our format
 *
 * @param result - OpenAI moderation result
 * @returns Our moderation scan result
 */
function convertOpenAIResult(
  result: OpenAIModerationResult,
): ModerationScanResult {
  const violations: Violation[] = [];

  // Check each category and create violations
  if (result.flagged) {
    Object.entries(result.categories).forEach(([category, flagged]) => {
      if (flagged) {
        const score =
          result.category_scores[category as keyof ModerationCategoryScores];
        const confidence = Math.round(score * 100);

        violations.push({
          type: category,
          severity: getSeverity(category, score),
          details: getCategoryDescription(category),
          confidence,
        });
      }
    });
  }

  // Calculate overall confidence (highest category score)
  const maxScore = Math.max(...Object.values(result.category_scores));
  const overallConfidence = Math.round(maxScore * 100);

  // Determine action based on confidence
  let action: "approve" | "flag" | "reject";
  if (!result.flagged || overallConfidence < 60) {
    action = "approve";
  } else if (overallConfidence > 85) {
    action = "reject";
  } else {
    action = "flag";
  }

  return {
    approved: action === "approve",
    confidence: overallConfidence,
    action,
    violations,
  };
}

/**
 * Determine severity based on category and score
 */
function getSeverity(
  category: string,
  score: number,
): "low" | "medium" | "high" {
  // High severity categories
  const highSeverityCategories = [
    "hate/threatening",
    "harassment/threatening",
    "self-harm/intent",
    "sexual/minors",
    "violence/graphic",
  ];

  if (highSeverityCategories.includes(category)) {
    return "high";
  }

  // Score-based severity
  if (score > 0.8) {
    return "high";
  } else if (score > 0.5) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Get human-readable description for category
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    hate: "Content promotes hatred based on identity",
    "hate/threatening": "Content threatens violence based on identity",
    harassment: "Content harasses or bullies individuals",
    "harassment/threatening": "Content threatens or intimidates individuals",
    "self-harm": "Content promotes self-harm",
    "self-harm/intent": "Content expresses intent to self-harm",
    "self-harm/instructions": "Content provides self-harm instructions",
    sexual: "Content is sexually explicit",
    "sexual/minors": "Content sexualizes minors",
    violence: "Content depicts violence",
    "violence/graphic": "Content depicts graphic violence",
  };

  return descriptions[category] || `Flagged for: ${category}`;
}

/**
 * Check if content contains scam indicators
 *
 * This is a simple pattern-based check for common scam phrases.
 * More sophisticated ML-based detection will be implemented in Task 9.
 *
 * @param text - Text to check
 * @returns Scam detection result
 */
export function detectScamIndicators(text: string): {
  hasScamIndicators: boolean;
  indicators: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();

  // Common scam patterns in Nigerian marketplace context
  const scamPatterns = [
    {
      pattern: /pay.*before.*delivery/i,
      indicator: "Requests payment before delivery",
    },
    {
      pattern: /send.*money.*first/i,
      indicator: "Requests money transfer first",
    },
    {
      pattern: /western union|moneygram/i,
      indicator: "Mentions wire transfer services",
    },
    {
      pattern: /guaranteed.*profit/i,
      indicator: "Promises guaranteed profits",
    },
    {
      pattern: /too good to be true/i,
      indicator: "Too good to be true pricing",
    },
    { pattern: /urgent.*sale/i, indicator: "Creates false urgency" },
    {
      pattern: /contact.*whatsapp.*only/i,
      indicator: "Avoids platform communication",
    },
    {
      pattern: /bitcoin|cryptocurrency.*investment/i,
      indicator: "Cryptocurrency investment scheme",
    },
  ];

  const foundIndicators: string[] = [];

  scamPatterns.forEach(({ pattern, indicator }) => {
    if (pattern.test(lowerText)) {
      foundIndicators.push(indicator);
    }
  });

  const hasScamIndicators = foundIndicators.length > 0;
  const confidence = Math.min(foundIndicators.length * 25, 100);

  return {
    hasScamIndicators,
    indicators: foundIndicators,
    confidence,
  };
}

/**
 * Detect unrealistic pricing
 *
 * @param price - Listing price
 * @param category - Product category
 * @param averagePrice - Average price for category (optional)
 * @returns Price anomaly detection result
 */
export function detectPriceAnomaly(
  price: number,
  category: string,
  averagePrice?: number,
): {
  isAnomalous: boolean;
  reason: string;
  confidence: number;
} {
  // Check for suspiciously low prices
  if (price < 100) {
    return {
      isAnomalous: true,
      reason: "Price is suspiciously low (< ₦100)",
      confidence: 80,
    };
  }

  // Check against category average if provided
  if (averagePrice && averagePrice > 0) {
    const percentDiff = ((averagePrice - price) / averagePrice) * 100;

    // More than 80% below average is suspicious
    if (percentDiff > 80) {
      return {
        isAnomalous: true,
        reason: `Price is ${Math.round(percentDiff)}% below category average`,
        confidence: Math.min(percentDiff, 100),
      };
    }
  }

  return {
    isAnomalous: false,
    reason: "Price appears normal",
    confidence: 0,
  };
}

/**
 * Health check for OpenAI API
 *
 * @returns True if API is accessible
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    const client = getOpenAIClient();

    // Simple test with minimal content
    await client.moderations.create({
      input: "test",
    });

    return true;
  } catch (error) {
    console.error("OpenAI health check failed:", error);
    return false;
  }
}
