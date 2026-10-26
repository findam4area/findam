/**
 * Live Streaming Service Client
 *
 * Provides integration with video streaming services (Agora, Mux, or similar)
 * for live video selling feature (Requirement 2).
 *
 * Tasks: 18.3
 * Requirements: 2.1
 */

import { LiveStreamCredentials } from "@/lib/types";

// Streaming service configuration
const STREAMING_SERVICE = process.env.STREAMING_SERVICE || "agora"; // 'agora' | 'mux' | 'custom'

/**
 * Streaming Service Interface
 * Defines the contract for streaming service implementations
 */
interface StreamingServiceProvider {
  createStream(
    sessionId: string,
    userId: string,
  ): Promise<LiveStreamCredentials>;
  endStream(sessionId: string): Promise<void>;
  getStreamStatus(sessionId: string): Promise<StreamStatus>;
  getViewerCount(sessionId: string): Promise<number>;
}

export interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  startedAt?: string;
  durationSeconds?: number;
}

/**
 * Agora Streaming Service Implementation
 * Recommended for Nigerian market due to low latency and reliability
 */
class AgoraStreamingService implements StreamingServiceProvider {
  private appId: string;
  private appCertificate: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || "";
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || "";

    if (!this.appId || !this.appCertificate) {
      console.warn(
        "Agora credentials not configured. Live streaming will not work.",
      );
    }
  }

  async createStream(
    sessionId: string,
    userId: string,
  ): Promise<LiveStreamCredentials> {
    // In production, this would call Agora's API to create a channel
    // and generate tokens for broadcaster and viewers

    // For now, return mock credentials structure
    // TODO: Implement actual Agora SDK integration

    const channelName = `live_${sessionId}`;
    const rtmpUrl = `rtmp://live.agora.io/live/${channelName}`;
    const streamKey = this.generateStreamKey(sessionId, userId);
    const playbackUrl = `https://live.agora.io/live/${channelName}/index.m3u8`;

    return {
      stream_url: playbackUrl,
      stream_key: streamKey,
      rtmp_url: rtmpUrl,
      playback_url: playbackUrl,
    };
  }

  async endStream(sessionId: string): Promise<void> {
    // In production, this would call Agora's API to end the channel
    // TODO: Implement actual Agora SDK integration
    console.log(`Ending stream for session: ${sessionId}`);
  }

  async getStreamStatus(sessionId: string): Promise<StreamStatus> {
    // In production, this would query Agora's API for stream status
    // TODO: Implement actual Agora SDK integration
    return {
      isLive: false,
      viewerCount: 0,
    };
  }

  async getViewerCount(sessionId: string): Promise<number> {
    // In production, this would query Agora's API for viewer count
    // TODO: Implement actual Agora SDK integration
    return 0;
  }

  private generateStreamKey(sessionId: string, userId: string): string {
    // In production, generate a secure token using Agora's token builder
    // TODO: Implement actual Agora token generation
    return `${sessionId}_${userId}_${Date.now()}`;
  }
}

/**
 * Mux Streaming Service Implementation
 * Alternative streaming service with good global coverage
 */
class MuxStreamingService implements StreamingServiceProvider {
  private tokenId: string;
  private tokenSecret: string;

  constructor() {
    this.tokenId = process.env.MUX_TOKEN_ID || "";
    this.tokenSecret = process.env.MUX_TOKEN_SECRET || "";

    if (!this.tokenId || !this.tokenSecret) {
      console.warn(
        "Mux credentials not configured. Live streaming will not work.",
      );
    }
  }

  async createStream(
    sessionId: string,
    userId: string,
  ): Promise<LiveStreamCredentials> {
    // In production, this would call Mux's API to create a live stream
    // TODO: Implement actual Mux API integration

    const streamKey = this.generateStreamKey(sessionId, userId);
    const rtmpUrl = `rtmps://global-live.mux.com:443/app`;
    const playbackUrl = `https://stream.mux.com/${sessionId}.m3u8`;

    return {
      stream_url: playbackUrl,
      stream_key: streamKey,
      rtmp_url: rtmpUrl,
      playback_url: playbackUrl,
    };
  }

  async endStream(sessionId: string): Promise<void> {
    // In production, this would call Mux's API to end the stream
    // TODO: Implement actual Mux API integration
    console.log(`Ending stream for session: ${sessionId}`);
  }

  async getStreamStatus(sessionId: string): Promise<StreamStatus> {
    // In production, this would query Mux's API for stream status
    // TODO: Implement actual Mux API integration
    return {
      isLive: false,
      viewerCount: 0,
    };
  }

  async getViewerCount(sessionId: string): Promise<number> {
    // In production, this would query Mux's API for viewer count
    // TODO: Implement actual Mux API integration
    return 0;
  }

  private generateStreamKey(sessionId: string, userId: string): string {
    // In production, use Mux's stream key from API response
    // TODO: Implement actual Mux stream key generation
    return `${sessionId}_${userId}_${Date.now()}`;
  }
}

/**
 * Custom/Mock Streaming Service Implementation
 * For development and testing purposes
 */
class MockStreamingService implements StreamingServiceProvider {
  async createStream(
    sessionId: string,
    userId: string,
  ): Promise<LiveStreamCredentials> {
    // Mock credentials for development
    return {
      stream_url: `https://mock-stream.findamng.com/live/${sessionId}`,
      stream_key: `mock_key_${sessionId}_${userId}`,
      rtmp_url: `rtmp://mock-rtmp.findamng.com/live`,
      playback_url: `https://mock-stream.findamng.com/live/${sessionId}/index.m3u8`,
    };
  }

  async endStream(sessionId: string): Promise<void> {
    console.log(`[Mock] Ending stream for session: ${sessionId}`);
  }

  async getStreamStatus(sessionId: string): Promise<StreamStatus> {
    return {
      isLive: false,
      viewerCount: 0,
    };
  }

  async getViewerCount(sessionId: string): Promise<number> {
    return 0;
  }
}

/**
 * Streaming Service Factory
 * Returns the appropriate streaming service based on configuration
 */
function getStreamingService(): StreamingServiceProvider {
  switch (STREAMING_SERVICE) {
    case "agora":
      return new AgoraStreamingService();
    case "mux":
      return new MuxStreamingService();
    case "mock":
    default:
      return new MockStreamingService();
  }
}

// Export singleton instance
export const streamingService = getStreamingService();

/**
 * Helper function to create a live stream
 */
export async function createLiveStream(
  sessionId: string,
  userId: string,
): Promise<LiveStreamCredentials> {
  return streamingService.createStream(sessionId, userId);
}

/**
 * Helper function to end a live stream
 */
export async function endLiveStream(sessionId: string): Promise<void> {
  return streamingService.endStream(sessionId);
}

/**
 * Helper function to get stream status
 */
export async function getStreamStatus(
  sessionId: string,
): Promise<StreamStatus> {
  return streamingService.getStreamStatus(sessionId);
}

/**
 * Helper function to get viewer count
 */
export async function getViewerCount(sessionId: string): Promise<number> {
  return streamingService.getViewerCount(sessionId);
}

/**
 * Validate stream duration (max 120 minutes per Requirement 2.9)
 */
export function validateStreamDuration(startedAt: Date): boolean {
  const now = new Date();
  const durationMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);
  return durationMinutes <= 120;
}

/**
 * Check if recording is still available (24 hours after broadcast - Requirement 2.8)
 */
export function isRecordingAvailable(
  recordingExpiresAt: string | null,
): boolean {
  if (!recordingExpiresAt) return false;
  return new Date(recordingExpiresAt) > new Date();
}
