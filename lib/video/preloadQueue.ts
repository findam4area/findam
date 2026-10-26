/**
 * Video Preload Queue
 * Requirements: 1.6
 *
 * Manages preloading of next 2 videos in sequence
 * Handles memory management and cleanup
 */

interface PreloadedVideo {
  videoId: string;
  videoElement: HTMLVideoElement;
  loadedAt: number;
}

class VideoPreloadQueue {
  private preloadedVideos: Map<string, PreloadedVideo> = new Map();
  private maxPreloadCount = 2; // Requirement 1.6: Preload next 2 videos
  private maxCacheAge = 5 * 60 * 1000; // 5 minutes cache
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Preload videos starting from the given index
   * Requirement 1.6: Preload next 2 videos
   */
  preloadVideos(
    videos: Array<{ id: string; videoUrl: string }>,
    currentIndex: number,
  ): void {
    // Calculate which videos to preload
    const videosToPreload = videos.slice(
      currentIndex + 1,
      currentIndex + 1 + this.maxPreloadCount,
    );

    // Preload each video
    videosToPreload.forEach((video) => {
      if (!this.preloadedVideos.has(video.id)) {
        this.preloadVideo(video.id, video.videoUrl);
      }
    });

    // Clean up videos that are no longer needed
    this.cleanupOldVideos(videosToPreload.map((v) => v.id));
  }

  /**
   * Preload a single video
   */
  private preloadVideo(videoId: string, videoUrl: string): void {
    try {
      const videoElement = document.createElement("video");
      videoElement.src = videoUrl;
      videoElement.preload = "auto";
      videoElement.muted = true;
      videoElement.playsInline = true;

      // Load the video metadata and initial frames
      videoElement.load();

      // Store the preloaded video
      this.preloadedVideos.set(videoId, {
        videoId,
        videoElement,
        loadedAt: Date.now(),
      });

      // Listen for load completion
      videoElement.addEventListener("loadeddata", () => {
        console.log(`Video ${videoId} preloaded successfully`);
      });

      videoElement.addEventListener("error", (e) => {
        console.error(`Error preloading video ${videoId}:`, e);
        this.removeVideo(videoId);
      });
    } catch (error) {
      console.error(`Failed to preload video ${videoId}:`, error);
    }
  }

  /**
   * Get a preloaded video element
   */
  getPreloadedVideo(videoId: string): HTMLVideoElement | null {
    const preloaded = this.preloadedVideos.get(videoId);
    return preloaded?.videoElement || null;
  }

  /**
   * Check if a video is preloaded
   */
  isPreloaded(videoId: string): boolean {
    return this.preloadedVideos.has(videoId);
  }

  /**
   * Remove a specific video from the queue
   */
  removeVideo(videoId: string): void {
    const preloaded = this.preloadedVideos.get(videoId);
    if (preloaded) {
      // Clean up the video element
      preloaded.videoElement.src = "";
      preloaded.videoElement.load();
      this.preloadedVideos.delete(videoId);
    }
  }

  /**
   * Clean up videos that are no longer in the preload range
   */
  private cleanupOldVideos(keepVideoIds: string[]): void {
    const videosToRemove: string[] = [];

    this.preloadedVideos.forEach((preloaded, videoId) => {
      // Remove if not in the keep list
      if (!keepVideoIds.includes(videoId)) {
        videosToRemove.push(videoId);
      }
    });

    videosToRemove.forEach((videoId) => {
      this.removeVideo(videoId);
    });
  }

  /**
   * Start periodic cleanup of stale videos
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const videosToRemove: string[] = [];

      this.preloadedVideos.forEach((preloaded, videoId) => {
        // Remove videos older than max cache age
        if (now - preloaded.loadedAt > this.maxCacheAge) {
          videosToRemove.push(videoId);
        }
      });

      videosToRemove.forEach((videoId) => {
        this.removeVideo(videoId);
      });
    }, 60000); // Run every minute
  }

  /**
   * Clear all preloaded videos and stop cleanup
   */
  destroy(): void {
    // Clear all videos
    this.preloadedVideos.forEach((_, videoId) => {
      this.removeVideo(videoId);
    });
    this.preloadedVideos.clear();

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.preloadedVideos.size;
  }

  /**
   * Get all preloaded video IDs
   */
  getPreloadedVideoIds(): string[] {
    return Array.from(this.preloadedVideos.keys());
  }
}

// Export singleton instance
export const videoPreloadQueue = new VideoPreloadQueue();

// Export class for testing
export { VideoPreloadQueue };
