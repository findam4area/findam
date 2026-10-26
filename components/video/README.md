# Video Feed Components

This directory contains the video feed UI components for the FindAm marketplace, implementing a TikTok-style vertical video feed for product listings.

## Components

### VideoFeedContainer

The main container component that manages the vertical video feed.

**Features:**

- Auto-play on scroll into view using Intersection Observer API (Requirement 1.2)
- Audio mute/unmute on tap (Requirement 1.3)
- Vertical scroll detection with snap scrolling
- Preloads next 2 videos for smooth playback (Requirement 1.6)
- Tracks video view duration for analytics (Requirement 1.8)
- Infinite scroll with pagination support

**Props:**

- `videos`: Array of VideoListing objects
- `onVideoView`: Optional callback for tracking video views
- `onLoadMore`: Optional callback for loading more videos

**Usage:**

```tsx
import { VideoFeedContainer } from "@/components/video";

<VideoFeedContainer
  videos={videoListings}
  onVideoView={(videoId, duration) => trackView(videoId, duration)}
  onLoadMore={() => loadMoreVideos()}
/>;
```

### VideoPlayer

Video playback component with controls and loading states.

**Features:**

- Auto-play and pause based on active state (Requirement 1.2)
- Loop playback (Requirement 1.7)
- Tap-to-toggle audio (Requirement 1.3)
- Loading and error states
- View duration tracking

**Props:**

- `video`: VideoListing object
- `isActive`: Boolean indicating if video should play
- `isMuted`: Boolean for audio state
- `onAudioToggle`: Callback for audio toggle
- `onVideoView`: Optional callback for view tracking

### VideoOverlay

Product information overlay displayed on top of videos.

**Features:**

- Displays product title, price, and seller info (Requirement 1.4)
- Seller verification badge
- View and like counts
- Action buttons: Like, Comment, Share, Buy (Requirement 1.9)
- Tap handler to navigate to listing details (Requirement 1.9)

**Props:**

- `video`: VideoListing object

## Utilities

### videoPreloadQueue

Manages preloading of videos for smooth playback.

**Features:**

- Preloads next 2 videos in sequence (Requirement 1.6)
- Memory management and cleanup
- Automatic cleanup of old videos
- Prevents duplicate preloading

**Usage:**

```tsx
import { videoPreloadQueue } from "@/lib/video/preloadQueue";

// Preload videos
videoPreloadQueue.preloadVideos(videos, currentIndex);

// Check if video is preloaded
const isPreloaded = videoPreloadQueue.isPreloaded(videoId);

// Get preloaded video element
const videoElement = videoPreloadQueue.getPreloadedVideo(videoId);

// Cleanup on unmount
videoPreloadQueue.destroy();
```

## Requirements Mapping

- **Requirement 1.2**: Auto-play videos when scrolled into view with audio muted by default
- **Requirement 1.3**: Tap video to toggle audio on/off
- **Requirement 1.4**: Display product title, price, and seller information as overlay
- **Requirement 1.6**: Preload next 2 videos for smooth playback
- **Requirement 1.7**: Loop videos continuously after playback completes
- **Requirement 1.8**: Track view duration for analytics
- **Requirement 1.9**: Navigate to listing details when tapping product overlay

## Testing

Unit tests are located in `__tests__/` directories:

- `components/video/__tests__/video-components.test.tsx`: Tests for VideoPlayer and VideoOverlay
- `lib/video/__tests__/preloadQueue.test.ts`: Tests for video preload queue

Run tests:

```bash
npm test -- --run components/video
npm test -- --run lib/video
```

## Accessibility

- Keyboard navigation support
- ARIA labels for video elements and buttons
- Screen reader announcements
- Proper semantic HTML

## Performance

- Intersection Observer for efficient scroll detection
- Video preloading for smooth transitions
- Memory management and cleanup
- Lazy loading of video content
