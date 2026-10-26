/**
 * Live Streaming Module
 *
 * Exports streaming service functionality for live video selling feature
 * Tasks: 18.3
 * Requirements: 2.1
 */

export {
  streamingService,
  createLiveStream,
  endLiveStream,
  getStreamStatus,
  getViewerCount,
  validateStreamDuration,
  isRecordingAvailable,
  type StreamStatus,
} from "./client";
