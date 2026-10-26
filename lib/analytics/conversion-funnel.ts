/**
 * Conversion Funnel Tracking System
 * Tracks user journey through conversion funnel: view → click → contact → purchase
 * Requirements: 18.4, 30.6
 */

import { trackEvent } from './index';
import { ANALYTICS_CONFIG } from './config';

export type FunnelStep = 'view' | 'click' | 'contact' | 'purchase';

export interface FunnelEvent {
  step: FunnelStep;
  listingId: string;
  listingTitle?: string;
  listingPrice?: number;
  categoryId?: string;
  categoryName?: string;
  vendorId?: string;
  vendorName?: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface FunnelMetrics {
  totalViews: number;
  totalClicks: number;
  totalContacts: number;
  totalPurchases: number;
  viewToClickRate: number;
  clickToContactRate: number;
  contactToPurchaseRate: number;
  overallConversionRate: number;
}

/**
 * Track conversion funnel step
 * Requirements: 18.4, 30.6
 * 
 * @param event - Funnel event data
 */
export function trackConversionFunnel(event: FunnelEvent) {
  const eventName = ANALYTICS_CONFIG.events.funnel[event.step];
  
  trackEvent(eventName, {
    // Core funnel data
    funnel_step: event.step,
    listing_id: event.listingId,
    listing_title: event.listingTitle,
    listing_price: event.listingPrice,
    
    // Category context
    category_id: event.categoryId,
    category_name: event.categoryName,
    
    // Vendor context
    vendor_id: event.vendorId,
    vendor_name: event.vendorName,
    
    // Session tracking
    session_id: event.sessionId || generateSessionId(),
    user_id: event.userId,
    
    // Timestamp
    timestamp: event.timestamp,
    
    // Additional metadata
    ...event.metadata,
  });
}

/**
 * Track listing view (funnel step 1)
 * Requirements: 18.4
 */
export function trackListingViewFunnel(
  listingId: string,
  listingTitle: string,
  metadata?: {
    price?: number;
    categoryId?: string;
    categoryName?: string;
    vendorId?: string;
    vendorName?: string;
    source?: string; // Where user came from (search, category, homepage, etc.)
    position?: number; // Position in list
  }
) {
  trackConversionFunnel({
    step: 'view',
    listingId,
    listingTitle,
    listingPrice: metadata?.price,
    categoryId: metadata?.categoryId,
    categoryName: metadata?.categoryName,
    vendorId: metadata?.vendorId,
    vendorName: metadata?.vendorName,
    timestamp: new Date().toISOString(),
    metadata: {
      source: metadata?.source,
      position: metadata?.position,
    },
  });
}

/**
 * Track listing click (funnel step 2)
 * Requirements: 18.4
 */
export function trackListingClickFunnel(
  listingId: string,
  listingTitle: string,
  metadata?: {
    price?: number;
    categoryId?: string;
    categoryName?: string;
    vendorId?: string;
    vendorName?: string;
    clickElement?: string; // What was clicked (card, image, title, etc.)
    source?: string;
  }
) {
  trackConversionFunnel({
    step: 'click',
    listingId,
    listingTitle,
    listingPrice: metadata?.price,
    categoryId: metadata?.categoryId,
    categoryName: metadata?.categoryName,
    vendorId: metadata?.vendorId,
    vendorName: metadata?.vendorName,
    timestamp: new Date().toISOString(),
    metadata: {
      click_element: metadata?.clickElement,
      source: metadata?.source,
    },
  });
}

/**
 * Track vendor contact (funnel step 3)
 * Requirements: 18.4
 */
export function trackVendorContactFunnel(
  listingId: string,
  vendorId: string,
  metadata?: {
    listingTitle?: string;
    vendorName?: string;
    contactMethod?: string; // chat, phone, whatsapp, email
    messageLength?: number;
  }
) {
  trackConversionFunnel({
    step: 'contact',
    listingId,
    vendorId,
    listingTitle: metadata?.listingTitle,
    vendorName: metadata?.vendorName,
    timestamp: new Date().toISOString(),
    metadata: {
      contact_method: metadata?.contactMethod,
      message_length: metadata?.messageLength,
    },
  });
}

/**
 * Track purchase completion (funnel step 4)
 * Requirements: 18.4
 */
export function trackPurchaseFunnel(
  listingId: string,
  vendorId: string,
  metadata?: {
    listingTitle?: string;
    vendorName?: string;
    price?: number;
    quantity?: number;
    totalAmount?: number;
    paymentMethod?: string;
    orderId?: string;
  }
) {
  trackConversionFunnel({
    step: 'purchase',
    listingId,
    vendorId,
    listingTitle: metadata?.listingTitle,
    vendorName: metadata?.vendorName,
    listingPrice: metadata?.price,
    timestamp: new Date().toISOString(),
    metadata: {
      quantity: metadata?.quantity,
      total_amount: metadata?.totalAmount,
      payment_method: metadata?.paymentMethod,
      order_id: metadata?.orderId,
    },
  });
}

/**
 * Generate unique session ID for funnel tracking
 * Persists across page navigations within same session
 */
function generateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const STORAGE_KEY = 'funnel_session_id';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  
  // Try to get existing session
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const { id, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      
      // Return existing ID if session is still valid
      if (age < SESSION_DURATION) {
        return id;
      }
    } catch (e) {
      // Invalid stored data, generate new
    }
  }
  
  // Generate new session ID
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: newId,
      timestamp: Date.now(),
    })
  );
  
  return newId;
}

/**
 * Calculate funnel conversion rates from raw event counts
 * Requirements: 18.4, 30.6
 */
export function calculateFunnelMetrics(
  views: number,
  clicks: number,
  contacts: number,
  purchases: number
): FunnelMetrics {
  return {
    totalViews: views,
    totalClicks: clicks,
    totalContacts: contacts,
    totalPurchases: purchases,
    
    // Conversion rates between steps
    viewToClickRate: views > 0 ? (clicks / views) * 100 : 0,
    clickToContactRate: clicks > 0 ? (contacts / clicks) * 100 : 0,
    contactToPurchaseRate: contacts > 0 ? (purchases / contacts) * 100 : 0,
    
    // Overall conversion rate (view to purchase)
    overallConversionRate: views > 0 ? (purchases / views) * 100 : 0,
  };
}

/**
 * Track funnel drop-off point
 * Helps identify where users abandon the conversion process
 * Requirements: 18.4
 */
export function trackFunnelDropOff(
  fromStep: FunnelStep,
  listingId: string,
  reason?: string
) {
  trackEvent('funnel_drop_off', {
    from_step: fromStep,
    listing_id: listingId,
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track funnel completion time
 * Measures time from first view to final purchase
 * Requirements: 18.4
 */
export function trackFunnelCompletionTime(
  listingId: string,
  durationMs: number
) {
  trackEvent('funnel_completion', {
    listing_id: listingId,
    duration_ms: durationMs,
    duration_minutes: Math.round(durationMs / 60000),
    timestamp: new Date().toISOString(),
  });
}
