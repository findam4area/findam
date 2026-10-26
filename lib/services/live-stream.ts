/**
 * Live Stream Service
 *
 * Manages live streaming sessions including session lifecycle,
 * viewer tracking, product pinning, and real-time updates.
 *
 * Requirements: 2.1, 2.2, 2.4, 2.9
 * Tasks: 19.1, 19.4, 19.9
 */

import { createClient } from "@/lib/supabase/server";
import { createLiveStream, endLiveStream } from "@/lib/streaming/client";
import {
  notifyFollowersLive,
  notifySessionEnded,
  notifySessionTimeLimit,
  notifySessionTerminated,
} from "./live-notifications";
import type {
  LiveSession,
  PinnedProduct,
  LiveStreamCredentials,
} from "@/lib/types";

/**
 * Live Stream Service
 *
 * Handles all live streaming operations including:
 * - Starting and ending sessions
 * - Real-time viewer count tracking
 * - Product pinning (max 5)
 * - Session duration enforcement (120 minutes)
 */
export class LiveStreamService {
  /**
   * Start a live streaming session
   *
   * Requirements: 2.1, 2.2
   *
   * @param sessionId - Live session ID
   * @param userId - Seller user ID
   * @returns Stream credentials and updated session
   */
  async startSession(
    sessionId: string,
    userId: string,
  ): Promise<{ credentials: LiveStreamCredentials; session: LiveSession }> {
    const supabase = await createClient();

    // Verify session exists and belongs to user
    const { data: session, error: fetchError } = await (supabase as any)
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      throw new Error("Session not found or unauthorized");
    }

    // Check if session is already live
    if (session.stream_status === "live") {
      throw new Error("Session is already live");
    }

    // Check if session has ended or been terminated
    if (["ended", "terminated"].includes(session.stream_status)) {
      throw new Error("Cannot start an ended or terminated session");
    }

    // Create stream credentials via streaming service
    const credentials = await createLiveStream(sessionId, userId);

    // Update session to live status
    const { data: updatedSession, error: updateError } = await (supabase as any)
      .from("live_sessions")
      .update({
        stream_status: "live",
        stream_url: credentials.playback_url,
        stream_key: credentials.stream_key,
        started_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      throw new Error("Failed to start session");
    }

    // Notify followers that seller is live (Requirement 2.7)
    await notifyFollowersLive(
      sessionId,
      userId,
      updatedSession.title || "Live Session",
    );

    return {
      credentials,
      session: updatedSession as LiveSession,
    };
  }

  /**
   * End a live streaming session
   *
   * Requirements: 2.1, 2.8, 2.9
   *
   * @param sessionId - Live session ID
   * @param userId - Seller user ID
   * @param recordingUrl - Optional recording URL from streaming service
   * @returns Updated session
   */
  async endSession(
    sessionId: string,
    userId: string,
    recordingUrl?: string,
  ): Promise<LiveSession> {
    const supabase = await createClient();

    // Verify session exists and belongs to user
    const { data: session, error: fetchError } = await (supabase as any)
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      throw new Error("Session not found or unauthorized");
    }

    // Check if session is live
    if (session.stream_status !== "live") {
      throw new Error("Session is not currently live");
    }

    // End stream via streaming service
    await endLiveStream(sessionId);

    // Calculate duration
    const startedAt = session.started_at
      ? new Date(session.started_at)
      : new Date();
    const endedAt = new Date();
    const durationMinutes = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / (1000 * 60),
    );

    // Update session to ended status
    // Recording expiration is handled by database trigger (24 hours)
    const { data: updatedSession, error: updateError } = await (supabase as any)
      .from("live_sessions")
      .update({
        stream_status: "ended",
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes,
        recording_url: recordingUrl || null,
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      throw new Error("Failed to end session");
    }

    // Notify participants that session ended (Requirement 2.8)
    await notifySessionEnded(sessionId, userId, recordingUrl);

    return updatedSession as LiveSession;
  }

  /**
   * Terminate a live session (for moderation)
   *
   * Requirements: 2.10
   *
   * @param sessionId - Live session ID
   * @param reason - Termination reason
   * @returns Updated session
   */
  async terminateSession(
    sessionId: string,
    reason: string,
  ): Promise<LiveSession> {
    const supabase = await createClient();

    // End stream via streaming service
    await endLiveStream(sessionId);

    // Update session to terminated status
    const { data: updatedSession, error: updateError } = await (supabase as any)
      .from("live_sessions")
      .update({
        stream_status: "terminated",
        ended_at: new Date().toISOString(),
        is_flagged: true,
        flagged_reason: reason,
        flagged_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      throw new Error("Failed to terminate session");
    }

    // Notify seller about termination (Requirement 2.10)
    const session = updatedSession as LiveSession;
    await notifySessionTerminated(sessionId, session.user_id, reason);

    return session;
  }

  /**
   * Track viewer count in real-time
   *
   * Requirements: 2.2
   *
   * @param sessionId - Live session ID
   * @param increment - Whether to increment (true) or decrement (false)
   */
  async updateViewerCount(
    sessionId: string,
    increment: boolean,
  ): Promise<void> {
    const supabase = await createClient();

    if (increment) {
      // Use database function to increment viewer count
      const { error } = await supabase.rpc("increment_viewer_count", {
        session_id_param: sessionId,
      });

      if (error) {
        console.error("Failed to increment viewer count:", error);
      }
    } else {
      // Use database function to decrement viewer count
      const { error } = await supabase.rpc("decrement_viewer_count", {
        session_id_param: sessionId,
      });

      if (error) {
        console.error("Failed to decrement viewer count:", error);
      }
    }
  }

  /**
   * Get current viewer count for a session
   *
   * Requirements: 2.2
   *
   * @param sessionId - Live session ID
   * @returns Current viewer count
   */
  async getViewerCount(sessionId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("live_sessions")
      .select("viewer_count")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.viewer_count;
  }

  /**
   * Pin a product to a live session
   *
   * Requirements: 2.4
   *
   * @param sessionId - Live session ID
   * @param listingId - Product listing ID to pin
   * @param userId - Seller user ID
   * @returns Updated pinned products array
   */
  async pinProduct(
    sessionId: string,
    listingId: string,
    userId: string,
  ): Promise<PinnedProduct[]> {
    const supabase = await createClient();

    // Use database function to pin product (handles max 5 validation)
    const { data, error } = await supabase.rpc("pin_product_to_session", {
      session_id_param: sessionId,
      listing_id_param: listingId,
    });

    if (error) {
      throw new Error(error.message || "Failed to pin product");
    }

    return data as unknown as PinnedProduct[];
  }

  /**
   * Unpin a product from a live session
   *
   * Requirements: 2.4
   *
   * @param sessionId - Live session ID
   * @param listingId - Product listing ID to unpin
   * @param userId - Seller user ID
   * @returns Updated pinned products array
   */
  async unpinProduct(
    sessionId: string,
    listingId: string,
    userId: string,
  ): Promise<PinnedProduct[]> {
    const supabase = await createClient();

    // Use database function to unpin product
    const { data, error } = await supabase.rpc("unpin_product_from_session", {
      session_id_param: sessionId,
      listing_id_param: listingId,
    });

    if (error) {
      throw new Error(error.message || "Failed to unpin product");
    }

    return data as unknown as PinnedProduct[];
  }

  /**
   * Check if session has exceeded duration limit
   *
   * Requirements: 2.9
   *
   * @param sessionId - Live session ID
   * @returns Whether session should be auto-ended
   */
  async checkDurationLimit(sessionId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from("live_sessions")
      .select("started_at, stream_status")
      .eq("id", sessionId)
      .single();

    if (error || !session || session.stream_status !== "live") {
      return false;
    }

    if (!session.started_at) {
      return false;
    }

    const startedAt = new Date(session.started_at);
    const now = new Date();
    const durationMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

    // Requirement 2.9: 120 minute limit
    return durationMinutes >= 120;
  }

  /**
   * Monitor session duration and auto-end if limit exceeded
   *
   * Requirements: 2.9
   *
   * @param sessionId - Live session ID
   * @returns Whether session was auto-ended
   */
  async monitorAndAutoEndSession(sessionId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: session, error } = await (supabase as any)
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !session || session.stream_status !== "live") {
      return false;
    }

    if (!session.started_at) {
      return false;
    }

    const startedAt = new Date(session.started_at);
    const now = new Date();
    const durationMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

    // Notify at 110 minutes (10 minutes before limit)
    if (durationMinutes >= 110 && durationMinutes < 115) {
      await notifySessionTimeLimit(sessionId, session.user_id, 10);
    }

    // Auto-end at 120 minutes
    if (durationMinutes >= 120) {
      try {
        await this.endSession(sessionId, session.user_id);
        return true;
      } catch (err) {
        console.error("Failed to auto-end session:", err);
        return false;
      }
    }

    return false;
  }

  /**
   * Get active live sessions
   *
   * Requirements: 2.1
   *
   * @returns Array of active live sessions with seller info
   */
  async getActiveSessions(): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_active_live_sessions");

    if (error) {
      console.error("Failed to get active sessions:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get session by ID
   *
   * @param sessionId - Live session ID
   * @returns Session data
   */
  async getSession(sessionId: string): Promise<LiveSession | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as LiveSession;
  }
}

/**
 * Create a singleton instance of LiveStreamService
 */
export const liveStreamService = new LiveStreamService();
