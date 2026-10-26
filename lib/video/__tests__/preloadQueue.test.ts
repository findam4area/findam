/**
 * Video Preload Queue Unit Tests
 * Requirements: 1.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { VideoPreloadQueue } from "../preloadQueue";

describe("VideoPreloadQueue", () => {
  let queue: VideoPreloadQueue;

  beforeEach(() => {
    queue = new VideoPreloadQueue();

    // Mock HTMLVideoElement
    global.HTMLVideoElement.prototype.load = vi.fn();
    global.HTMLVideoElement.prototype.play = vi
      .fn()
      .mockResolvedValue(undefined);
    global.HTMLVideoElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    queue.destroy();
  });

  it("initializes with empty queue", () => {
    expect(queue.getQueueSize()).toBe(0);
    expect(queue.getPreloadedVideoIds()).toEqual([]);
  });

  it("preloads next 2 videos from current index (Requirement 1.6)", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
      { id: "video-4", videoUrl: "https://example.com/video4.mp4" },
    ];

    queue.preloadVideos(videos, 0);

    // Should preload video-2 and video-3 (next 2 after index 0)
    const preloadedIds = queue.getPreloadedVideoIds();
    expect(preloadedIds).toContain("video-2");
    expect(preloadedIds).toContain("video-3");
    expect(preloadedIds.length).toBe(2);
  });

  it("does not preload more than 2 videos (Requirement 1.6)", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
      { id: "video-4", videoUrl: "https://example.com/video4.mp4" },
      { id: "video-5", videoUrl: "https://example.com/video5.mp4" },
    ];

    queue.preloadVideos(videos, 0);

    expect(queue.getQueueSize()).toBeLessThanOrEqual(2);
  });

  it("updates preload queue when current index changes", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
      { id: "video-4", videoUrl: "https://example.com/video4.mp4" },
    ];

    // Preload from index 0
    queue.preloadVideos(videos, 0);
    let preloadedIds = queue.getPreloadedVideoIds();
    expect(preloadedIds).toContain("video-2");
    expect(preloadedIds).toContain("video-3");

    // Move to index 1
    queue.preloadVideos(videos, 1);
    preloadedIds = queue.getPreloadedVideoIds();
    expect(preloadedIds).toContain("video-3");
    expect(preloadedIds).toContain("video-4");
  });

  it("cleans up old videos not in preload range", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
      { id: "video-4", videoUrl: "https://example.com/video4.mp4" },
    ];

    // Preload from index 0
    queue.preloadVideos(videos, 0);
    expect(queue.isPreloaded("video-2")).toBe(true);

    // Move to index 2 - video-2 should be cleaned up
    queue.preloadVideos(videos, 2);
    expect(queue.isPreloaded("video-2")).toBe(false);
  });

  it("handles edge case when near end of video list", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
    ];

    // At second-to-last video, should only preload 1 video
    queue.preloadVideos(videos, 1);
    expect(queue.getQueueSize()).toBe(1);
    expect(queue.isPreloaded("video-3")).toBe(true);

    // At last video, should preload nothing
    queue.preloadVideos(videos, 2);
    expect(queue.getQueueSize()).toBe(0);
  });

  it("can retrieve preloaded video element", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
    ];

    queue.preloadVideos(videos, 0);

    const videoElement = queue.getPreloadedVideo("video-2");
    expect(videoElement).toBeDefined();
    expect(videoElement).toBeInstanceOf(HTMLVideoElement);
  });

  it("returns null for non-preloaded video", () => {
    const videoElement = queue.getPreloadedVideo("non-existent");
    expect(videoElement).toBeNull();
  });

  it("can manually remove a video from queue", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
    ];

    queue.preloadVideos(videos, 0);
    expect(queue.isPreloaded("video-2")).toBe(true);

    queue.removeVideo("video-2");
    expect(queue.isPreloaded("video-2")).toBe(false);
  });

  it("clears all videos on destroy", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
    ];

    queue.preloadVideos(videos, 0);
    expect(queue.getQueueSize()).toBeGreaterThan(0);

    queue.destroy();
    expect(queue.getQueueSize()).toBe(0);
  });

  it("does not preload duplicate videos", () => {
    const videos = [
      { id: "video-1", videoUrl: "https://example.com/video1.mp4" },
      { id: "video-2", videoUrl: "https://example.com/video2.mp4" },
      { id: "video-3", videoUrl: "https://example.com/video3.mp4" },
    ];

    // Preload twice from same index
    queue.preloadVideos(videos, 0);
    const initialSize = queue.getQueueSize();

    queue.preloadVideos(videos, 0);
    const finalSize = queue.getQueueSize();

    // Size should remain the same
    expect(finalSize).toBe(initialSize);
  });
});
