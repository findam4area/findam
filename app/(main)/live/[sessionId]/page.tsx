/**
 * Live Stream Viewer Page
 *
 * Displays live video stream with chat, pinned products, and purchase flow.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * Tasks: 19.2, 19.3, 19.4, 19.6
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveStreamViewer } from "./LiveStreamViewer";
import type { LiveSession } from "@/lib/types";

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { sessionId } = await params;

  const { data: session } = await supabase
    .from("live_sessions")
    .select(
      `
      *,
      seller:profiles!user_id(username, avatar_url)
    `,
    )
    .eq("id", sessionId)
    .single();

  if (!session) {
    return {
      title: "Live Session Not Found",
    };
  }

  const isLive = session.stream_status === "live";
  const seller = session.seller as any;

  return {
    title: `${isLive ? "🔴 LIVE: " : ""}${session.title} - ${seller?.username || "FindAm"}`,
    description:
      session.description || `Watch ${seller?.username}'s live session`,
    openGraph: {
      title: session.title,
      description: session.description || undefined,
      images: session.thumbnail_url ? [session.thumbnail_url] : undefined,
      type: "video.other",
    },
  };
}

export default async function LiveStreamPage({ params }: PageProps) {
  const supabase = await createClient();
  const { sessionId } = await params;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch session details
  const { data: session, error } = await supabase
    .from("live_sessions")
    .select(
      `
      *,
      seller:profiles!user_id(username, avatar_url, trust_score)
    `,
    )
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    notFound();
  }

  // Check if session is accessible
  // Only live and ended sessions with recordings are viewable
  const isAccessible =
    session.stream_status === "live" ||
    (session.stream_status === "ended" &&
      session.recording_url &&
      session.recording_expires_at &&
      new Date(session.recording_expires_at) > new Date());

  if (!isAccessible) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Not Available
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {session.stream_status === "scheduled"
              ? "This session hasn't started yet."
              : session.stream_status === "terminated"
                ? "This session was terminated."
                : "This session has ended and the recording is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  const isHost = user?.id === session.user_id;
  const seller = session.seller as any;

  // Type assertion for the session with seller data
  const typedSession = session as unknown as LiveSession;

  return (
    <LiveStreamViewer
      session={typedSession}
      seller={seller}
      currentUserId={user?.id}
      isHost={isHost}
    />
  );
}
