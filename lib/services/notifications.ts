/**
 * Notification Service - Email notifications via Supabase
 * 
 * This module provides email notification functionality for the FindAm marketplace.
 * Sends notifications for listing approvals/rejections and vendor approvals/rejections.
 * 
 * Error handling strategy: Log errors but don't fail the approval workflow.
 * This ensures that approval actions complete successfully even if email delivery fails.
 * 
 * Requirements: 3.7, 4.7
 * Task: 8.15 Create notification service (basic email via Supabase)
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

interface NotificationResult {
  success: boolean;
  error?: string;
}

interface ListingData {
  id: string;
  title: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

interface VendorApplicationData {
  id: string;
  user_id: string;
  business_name: string;
  user_email?: string;
  user_name?: string;
}

// ============================================================================
// Email Configuration
// ============================================================================

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'notifications@findam.ng';
const APP_NAME = 'FindAm';
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Log notification errors without throwing
 * This ensures approval workflows complete even if email fails
 * 
 * Requirements: 3.7, 4.7
 */
function logNotificationError(context: string, error: any): void {
  console.error(`[Notification Error] ${context}:`, error);
  
  // In production, you might want to:
  // - Send to error tracking service (e.g., Sentry)
  // - Store in failed_notifications table for retry
  // - Alert administrators
}

/**
 * Fetch user email for notifications
 * 
 * @param userId - User UUID
 * @returns User email or null if not found
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      logNotificationError(`Failed to fetch user email for user ${userId}`, error);
      return null;
    }
    
    return data.email;
  } catch (error) {
    logNotificationError(`Unexpected error fetching user email for ${userId}`, error);
    return null;
  }
}

/**
 * Fetch listing data for notifications
 * 
 * @param listingId - Listing UUID
 * @returns Listing data with user information
 */
async function getListingData(listingId: string): Promise<ListingData | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        user_id,
        users:user_id (
          email,
          full_name
        )
      `)
      .eq('id', listingId)
      .single();
    
    if (error || !data) {
      logNotificationError(`Failed to fetch listing data for ${listingId}`, error);
      return null;
    }
    
    // Type assertion for nested user data
    const userData = data.users as any;
    
    return {
      id: data.id,
      title: data.title,
      user_id: data.user_id,
      user_email: userData?.email || undefined,
      user_name: userData?.full_name || undefined,
    };
  } catch (error) {
    logNotificationError(`Unexpected error fetching listing data for ${listingId}`, error);
    return null;
  }
}

/**
 * Fetch vendor application data for notifications
 * 
 * @param applicationId - Vendor application UUID
 * @returns Application data with user information
 */
async function getVendorApplicationData(applicationId: string): Promise<VendorApplicationData | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vendor_applications')
      .select(`
        id,
        user_id,
        business_name,
        users:user_id (
          email,
          full_name
        )
      `)
      .eq('id', applicationId)
      .single();
    
    if (error || !data) {
      logNotificationError(`Failed to fetch vendor application data for ${applicationId}`, error);
      return null;
    }
    
    // Type assertion for nested user data
    const userData = data.users as any;
    
    return {
      id: data.id,
      user_id: data.user_id,
      business_name: data.business_name,
      user_email: userData?.email || undefined,
      user_name: userData?.full_name || undefined,
    };
  } catch (error) {
    logNotificationError(`Unexpected error fetching vendor application data for ${applicationId}`, error);
    return null;
  }
}

/**
 * Send email via Supabase (placeholder for actual email service)
 * 
 * NOTE: This is a basic implementation that logs emails to console.
 * In production, you would integrate with:
 * - Supabase Edge Functions with Resend/SendGrid
 * - Direct integration with email service (SendGrid, Postmark, AWS SES)
 * - SMTP server via nodemailer
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param htmlBody - HTML email body
 * @param textBody - Plain text email body
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<NotificationResult> {
  try {
    // Log email for development/testing
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To:      ${to}
From:    ${FROM_EMAIL}
Subject: ${subject}

${textBody}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    // TODO: Integrate with actual email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: FROM_EMAIL,
    //   to,
    //   subject,
    //   html: htmlBody,
    //   text: textBody,
    // });
    
    // Example with Supabase Edge Function:
    // const supabase = await createClient();
    // await supabase.functions.invoke('send-email', {
    //   body: { to, subject, html: htmlBody, text: textBody }
    // });
    
    return { success: true };
  } catch (error) {
    logNotificationError('Email sending failed', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    };
  }
}

// ============================================================================
// Public Notification Functions
// ============================================================================

/**
 * Send notification when a listing is approved
 * 
 * Requirements: 3.7 - Email notifications for listing approval
 * 
 * @param userId - User ID (deprecated, will fetch from listing)
 * @param listingId - Listing UUID
 * @returns Promise that resolves when notification attempt is complete
 */
export async function sendListingApprovedNotification(
  userId: string,
  listingId: string
): Promise<void> {
  try {
    // Fetch listing data with user information
    const listing = await getListingData(listingId);
    
    if (!listing || !listing.user_email) {
      logNotificationError(
        'Cannot send listing approval notification',
        new Error(`Missing listing or user email for listing ${listingId}`)
      );
      return;
    }
    
    const userName = listing.user_name || 'there';
    const listingUrl = `${APP_URL}/listing/${listingId}`;
    
    // Compose email
    const subject = `🎉 Your listing "${listing.title}" has been approved!`;
    
    const textBody = `
Hi ${userName},

Great news! Your listing has been approved and is now live on ${APP_NAME}.

Listing: ${listing.title}
View your listing: ${listingUrl}

Your listing is now visible to all users browsing ${APP_NAME}. You can manage your listing anytime from your dashboard.

Best regards,
The ${APP_NAME} Team
    `.trim();
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #10b981; margin: 0 0 10px 0;">🎉 Listing Approved!</h1>
    <p style="margin: 0; font-size: 16px;">Hi ${userName},</p>
  </div>
  
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <p style="margin: 0 0 15px 0;">Great news! Your listing has been approved and is now live on ${APP_NAME}.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-weight: 600;">Listing:</p>
      <p style="margin: 0; font-size: 18px; color: #1f2937;">${listing.title}</p>
    </div>
    
    <a href="${listingUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 10px 0;">
      View Your Listing
    </a>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
      Your listing is now visible to all users browsing ${APP_NAME}. You can manage your listing anytime from your dashboard.
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>Best regards,<br>The ${APP_NAME} Team</p>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>
    `.trim();
    
    // Send email (error handling done internally)
    await sendEmail(listing.user_email, subject, htmlBody, textBody);
    
  } catch (error) {
    // Log error but don't throw - approval workflow must complete
    logNotificationError(`Failed to send listing approval notification for ${listingId}`, error);
  }
}

/**
 * Send notification when a listing is rejected
 * 
 * Requirements: 3.7 - Email notifications for listing rejection with reason
 * 
 * @param userId - User ID (deprecated, will fetch from listing)
 * @param listingId - Listing UUID
 * @param reason - Rejection reason provided by admin
 * @returns Promise that resolves when notification attempt is complete
 */
export async function sendListingRejectedNotification(
  userId: string,
  listingId: string,
  reason: string
): Promise<void> {
  try {
    // Fetch listing data with user information
    const listing = await getListingData(listingId);
    
    if (!listing || !listing.user_email) {
      logNotificationError(
        'Cannot send listing rejection notification',
        new Error(`Missing listing or user email for listing ${listingId}`)
      );
      return;
    }
    
    const userName = listing.user_name || 'there';
    const myListingsUrl = `${APP_URL}/listings/my-listings`;
    
    // Compose email
    const subject = `Your listing "${listing.title}" requires changes`;
    
    const textBody = `
Hi ${userName},

Thank you for submitting your listing to ${APP_NAME}. After review, we need you to make some changes before we can approve it.

Listing: ${listing.title}

Reason for rejection:
${reason}

What to do next:
1. Review the feedback above
2. Edit your listing to address the concerns
3. Resubmit for approval

View your listings: ${myListingsUrl}

If you have any questions, please don't hesitate to contact us.

Best regards,
The ${APP_NAME} Team
    `.trim();
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef3c7; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #d97706; margin: 0 0 10px 0;">📝 Listing Requires Changes</h1>
    <p style="margin: 0; font-size: 16px;">Hi ${userName},</p>
  </div>
  
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <p style="margin: 0 0 15px 0;">Thank you for submitting your listing to ${APP_NAME}. After review, we need you to make some changes before we can approve it.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-weight: 600;">Listing:</p>
      <p style="margin: 0; font-size: 18px; color: #1f2937;">${listing.title}</p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Reason for rejection:</p>
      <p style="margin: 0; color: #78350f;">${reason}</p>
    </div>
    
    <div style="margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 600;">What to do next:</p>
      <ol style="margin: 0; padding-left: 20px;">
        <li>Review the feedback above</li>
        <li>Edit your listing to address the concerns</li>
        <li>Resubmit for approval</li>
      </ol>
    </div>
    
    <a href="${myListingsUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 10px 0;">
      View My Listings
    </a>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
      If you have any questions, please don't hesitate to contact us.
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>Best regards,<br>The ${APP_NAME} Team</p>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>
    `.trim();
    
    // Send email (error handling done internally)
    await sendEmail(listing.user_email, subject, htmlBody, textBody);
    
  } catch (error) {
    // Log error but don't throw - rejection workflow must complete
    logNotificationError(`Failed to send listing rejection notification for ${listingId}`, error);
  }
}

/**
 * Send notification when a vendor application is approved
 * 
 * Requirements: 4.7 - Email notifications for vendor approval
 * 
 * @param userId - User ID (deprecated, will fetch from application)
 * @param applicationId - Vendor application UUID
 * @returns Promise that resolves when notification attempt is complete
 */
export async function sendVendorApprovedNotification(
  userId: string,
  applicationId: string
): Promise<void> {
  try {
    // Fetch vendor application data with user information
    const application = await getVendorApplicationData(applicationId);
    
    if (!application || !application.user_email) {
      logNotificationError(
        'Cannot send vendor approval notification',
        new Error(`Missing application or user email for application ${applicationId}`)
      );
      return;
    }
    
    const userName = application.user_name || 'there';
    const createListingUrl = `${APP_URL}/listings/create`;
    
    // Compose email
    const subject = `🎉 Your vendor application has been approved!`;
    
    const textBody = `
Hi ${userName},

Congratulations! Your vendor application for "${application.business_name}" has been approved.

You are now an approved vendor on ${APP_NAME}! This means:
✓ Your listings will display an "Approved Vendor" badge
✓ Customers can see you're a verified business
✓ You'll have access to vendor features

Ready to start selling? Create your first listing now!
Create Listing: ${createListingUrl}

Thank you for joining ${APP_NAME}. We're excited to have you on board!

Best regards,
The ${APP_NAME} Team
    `.trim();
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #10b981; margin: 0 0 10px 0;">🎉 Vendor Application Approved!</h1>
    <p style="margin: 0; font-size: 16px;">Hi ${userName},</p>
  </div>
  
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Congratulations! Your vendor application has been approved.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-weight: 600;">Business Name:</p>
      <p style="margin: 0; font-size: 18px; color: #1f2937;">${application.business_name}</p>
    </div>
    
    <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #1e40af;">You are now an approved vendor on ${APP_NAME}!</p>
      <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
        <li>Your listings will display an "Approved Vendor" badge</li>
        <li>Customers can see you're a verified business</li>
        <li>You'll have access to vendor features</li>
      </ul>
    </div>
    
    <p style="margin: 20px 0;">Ready to start selling? Create your first listing now!</p>
    
    <a href="${createListingUrl}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 10px 0;">
      Create Your First Listing
    </a>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
      Thank you for joining ${APP_NAME}. We're excited to have you on board!
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>Best regards,<br>The ${APP_NAME} Team</p>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>
    `.trim();
    
    // Send email (error handling done internally)
    await sendEmail(application.user_email, subject, htmlBody, textBody);
    
  } catch (error) {
    // Log error but don't throw - approval workflow must complete
    logNotificationError(`Failed to send vendor approval notification for ${applicationId}`, error);
  }
}

/**
 * Send notification when a vendor application is rejected
 * 
 * Requirements: 4.7 - Email notifications for vendor rejection with reason
 * 
 * @param userId - User ID (deprecated, will fetch from application)
 * @param applicationId - Vendor application UUID
 * @param reason - Rejection reason provided by admin
 * @returns Promise that resolves when notification attempt is complete
 */
export async function sendVendorRejectedNotification(
  userId: string,
  applicationId: string,
  reason: string
): Promise<void> {
  try {
    // Fetch vendor application data with user information
    const application = await getVendorApplicationData(applicationId);
    
    if (!application || !application.user_email) {
      logNotificationError(
        'Cannot send vendor rejection notification',
        new Error(`Missing application or user email for application ${applicationId}`)
      );
      return;
    }
    
    const userName = application.user_name || 'there';
    const applyUrl = `${APP_URL}/vendor/apply`;
    
    // Compose email
    const subject = `Your vendor application requires changes`;
    
    const textBody = `
Hi ${userName},

Thank you for your interest in becoming a vendor on ${APP_NAME}.

After reviewing your application for "${application.business_name}", we need some additional information or changes before we can approve it.

Reason:
${reason}

What to do next:
You can submit a new application with the requested changes. Please address the feedback above and resubmit.

Apply again: ${applyUrl}

If you have any questions about the feedback, feel free to contact us.

Best regards,
The ${APP_NAME} Team
    `.trim();
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef3c7; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #d97706; margin: 0 0 10px 0;">📝 Vendor Application Update</h1>
    <p style="margin: 0; font-size: 16px;">Hi ${userName},</p>
  </div>
  
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <p style="margin: 0 0 15px 0;">Thank you for your interest in becoming a vendor on ${APP_NAME}.</p>
    
    <p style="margin: 0 0 15px 0;">After reviewing your application, we need some additional information or changes before we can approve it.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-weight: 600;">Business Name:</p>
      <p style="margin: 0; font-size: 18px; color: #1f2937;">${application.business_name}</p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Reason:</p>
      <p style="margin: 0; color: #78350f;">${reason}</p>
    </div>
    
    <p style="margin: 20px 0;">You can submit a new application with the requested changes. Please address the feedback above and resubmit.</p>
    
    <a href="${applyUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 10px 0;">
      Apply Again
    </a>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
      If you have any questions about the feedback, feel free to contact us.
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>Best regards,<br>The ${APP_NAME} Team</p>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>
    `.trim();
    
    // Send email (error handling done internally)
    await sendEmail(application.user_email, subject, htmlBody, textBody);
    
  } catch (error) {
    // Log error but don't throw - rejection workflow must complete
    logNotificationError(`Failed to send vendor rejection notification for ${applicationId}`, error);
  }
}
