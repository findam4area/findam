/**
 * Live Session Moderation Service
 *
 * Provides AI-powered moderation for live streaming sessions including
 * chat message filtering and session termination for guideline violations.
 *
 * Requirements: 2.10
 * Task: 19.11
 */

import { createClient } from "@/lib/supabase/server";
import { scanTextContent } from "./openai-moderation";
import { liveStreamService } from "./live-stream";

/**
 * Moderate a chat message before it's displayed
 *
 * Requirements: 2.10
 *
 * @param message - Chat message text
 * @param sessionId - Live session ID
 * @param userId - User ID who sent the message
 * @returns Moderation result with action
 */
export async function moderateChatMessage(
  message: string,
  sessionId: string,
  userId: string,
): Promise<{
  approved: boolean;
  action: "approve" | "flag" | "reject";
  reason?: string;
}> {
  try {
    // Scan message content for violations
    const result = await scanTextContent(message);

    // Determine action based on confidence
    if (result.confidence > 85) {
      // High confidence violation - reject message
      return {
        approved: false,
        action: "reject",
        reason: result.violations[0]?.details || "Inappropriate content",
      };
    } else if (result.confidence > 60) {
      // Medium confidence - flag for review but allow
      await flagChatMessage(
        sessionId,
        userId,
        message,
        result.violations[0]?.details,
      );
      return {
        approved: true,
        action: "flag",
        reason: result.violations[0]?.details,
      };
    }

    // Low confidence or no violations - approve
    return {
      approved: true,
      action: "approve",
    };
  } catch (error) {
    console.error("Error moderating chat message:", error);
    // Default to approve on error to avoid blocking legitimate messages
    return {
      approved: true,
      action: "approve",
    };
  }
}

/**
 * Flag a chat message for manual review
 *
 * @param sessionId - Live session ID
 * @param userId - User ID who sent the message
 * @param message - Message content
 * @param reason - Flagging reason
 */
async function flagChatMessage(
  sessionId: string,
  userId: string,
  message: string,
  reason?: string,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Find the message and flag it
    await supabase
      .from("live_chat_messages")
      .update({ is_flagged: true })
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .eq("message", message);

    console.log(`Flagged chat message in session ${sessionId}: ${reason}`);
  } catch (error) {
    console.error("Error flagging chat message:", error);
  }
}

/**
 * Monitor live session for guideline violations
 *
 * This should be called periodically during a live session to check
 * for patterns of violations that warrant session termination.
 *
 * Requirements: 2.10
 *
 * @param sessionId - Live session ID
 * @returns Whether session was terminated
 */
export async function monitorSessionViolations(
  sessionId: string,
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get recent flagged messages (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: flaggedMessages, error } = await supabase
      .from("live_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_flagged", true)
      .gte("created_at", tenMinutesAgo);

    if (error) {
      console.error("Error fetching flagged messages:", error);
      return false;
    }

    // Termination criteria:
    // 1. More than 5 flagged messages in 10 minutes
    // 2. Multiple users reporting violations
    const flaggedCount = flaggedMessages?.length || 0;

    if (flaggedCount >= 5) {
      // Get session details
      const { data: session } = await supabase
        .from("live_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .single();

      if (!session) {
        return false;
      }

      // Terminate session
      const reason = `Session terminated due to multiple guideline violations (${flaggedCount} flagged messages in 10 minutes)`;
      await liveStreamService.terminateSession(sessionId, reason);

      console.log(`Terminated session ${sessionId}: ${reason}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error monitoring session violations:", error);
    return false;
  }
}

/**
 * Check if a user should be banned from chat
 *
 * @param userId - User ID to check
 * @param sessionId - Live session ID
 * @returns Whether user is banned from chat
 */
export async function isUserBannedFromChat(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Check recent flagged messages from this user
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: userFlaggedMessages } = await supabase
      .from("live_chat_messages")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .eq("is_flagged", true)
      .gte("created_at", fiveMinutesAgo);

    // Ban if user has 3+ flagged messages in 5 minutes
    return (userFlaggedMessages?.length || 0) >= 3;
  } catch (error) {
    console.error("Error checking user ban status:", error);
    return false;
  }
}

/**
 * Scan session title and description for violations
 *
 * Requirements: 2.10
 *
 * @param title - Session title
 * @param description - Session description
 * @returns Moderation result
 */
export async function moderateSessionContent(
  title: string,
  description: string,
): Promise<{
  approved: boolean;
  confidence: number;
  reason?: string;
}> {
  try {
    // Scan combined content
    const result = await scanTextContent(`${title} ${description}`);

    if (result.confidence > 85) {
      return {
        approved: false,
        confidence: result.confidence,
        reason: result.violations[0]?.details || "Inappropriate content",
      };
    }

    return {
      approved: true,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("Error moderating session content:", error);
    return {
      approved: true,
      confidence: 0,
    };
  }
}

/**
 * Get moderation statistics for a session
 *
 * @param sessionId - Live session ID
 * @returns Moderation statistics
 */
export async function getSessionModerationStats(sessionId: string): Promise<{
  totalMessages: number;
  flaggedMessages: number;
  deletedMessages: number;
  uniqueFlaggedUsers: number;
}> {
  try {
    const supabase = await createClient();

    const { data: messages } = await supabase
      .from("live_chat_messages")
      .select("*")
      .eq("session_id", sessionId);

    if (!messages) {
      return {
        totalMessages: 0,
        flaggedMessages: 0,
        deletedMessages: 0,
        uniqueFlaggedUsers: 0,
      };
    }

    const flaggedMessages = messages.filter((m) => m.is_flagged);
    const uniqueFlaggedUsers = new Set(flaggedMessages.map((m) => m.user_id))
      .size;

    return {
      totalMessages: messages.length,
      flaggedMessages: flaggedMessages.length,
      deletedMessages: messages.filter((m) => m.is_deleted).length,
      uniqueFlaggedUsers,
    };
  } catch (error) {
    console.error("Error getting moderation stats:", error);
    return {
      totalMessages: 0,
      flaggedMessages: 0,
      deletedMessages: 0,
      uniqueFlaggedUsers: 0,
    };
  }
}
