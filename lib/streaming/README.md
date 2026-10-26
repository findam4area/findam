# Live Streaming Infrastructure

This module provides the infrastructure for live video selling feature (Requirement 2).

## Overview

The live streaming system allows verified sellers to broadcast live video sessions to showcase and sell products in real-time. It includes:

- **Live Sessions**: Broadcast management with viewer tracking
- **Live Chat**: Real-time chat interface for viewer engagement
- **Product Pinning**: Pin up to 5 products during live sessions
- **Recording**: 24-hour recording availability after broadcast
- **Moderation**: AI-powered content moderation

## Database Schema

### `live_sessions` Table

Stores live video streaming sessions.

**Key Fields:**

- `stream_url`: URL for viewers to watch the stream
- `stream_key`: Private key for broadcaster (encrypted)
- `stream_status`: Session status (scheduled, live, ended, terminated)
- `viewer_count`: Real-time viewer count
- `pinned_products`: JSONB array of up to 5 pinned products
- `recording_url`: Recording available for 24 hours after broadcast
- `duration_minutes`: Session duration (max 120 minutes)

### `live_chat_messages` Table

Stores chat messages for live streaming sessions.

**Key Fields:**

- `session_id`: Reference to live session
- `user_id`: Message sender
- `message`: Chat message content
- `is_flagged`: Moderation flag
- `is_deleted`: Soft delete flag

## Streaming Service Integration

The system supports multiple streaming service providers:

### Agora (Recommended)

Recommended for Nigerian market due to low latency and reliability.

**Configuration:**

```env
STREAMING_SERVICE=agora
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

**Setup:**

1. Sign up at [Agora.io](https://www.agora.io/)
2. Create a project and get App ID and Certificate
3. Add credentials to `.env.local`

### Mux

Alternative streaming service with good global coverage.

**Configuration:**

```env
STREAMING_SERVICE=mux
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
```

**Setup:**

1. Sign up at [Mux.com](https://www.mux.com/)
2. Create API access tokens
3. Add credentials to `.env.local`

### Mock (Development)

For development and testing without external service.

**Configuration:**

```env
STREAMING_SERVICE=mock
```

## Usage

### Creating a Live Stream

```typescript
import { createLiveStream } from "@/lib/streaming";

const credentials = await createLiveStream(sessionId, userId);
// Returns: { stream_url, stream_key, rtmp_url, playback_url }
```

### Ending a Live Stream

```typescript
import { endLiveStream } from "@/lib/streaming";

await endLiveStream(sessionId);
```

### Getting Stream Status

```typescript
import { getStreamStatus } from "@/lib/streaming";

const status = await getStreamStatus(sessionId);
// Returns: { isLive, viewerCount, startedAt, durationSeconds }
```

### Validating Stream Duration

```typescript
import { validateStreamDuration } from "@/lib/streaming";

const isValid = validateStreamDuration(startedAt);
// Returns true if duration <= 120 minutes
```

### Checking Recording Availability

```typescript
import { isRecordingAvailable } from "@/lib/streaming";

const available = isRecordingAvailable(recordingExpiresAt);
// Returns true if recording is still available (within 24 hours)
```

## Database Functions

### `get_active_live_sessions()`

Returns all currently live sessions with seller information.

```sql
SELECT * FROM get_active_live_sessions();
```

### `increment_viewer_count(session_id)`

Increments viewer count for a session.

```sql
SELECT increment_viewer_count('session-uuid');
```

### `decrement_viewer_count(session_id)`

Decrements viewer count for a session.

```sql
SELECT decrement_viewer_count('session-uuid');
```

### `pin_product_to_session(session_id, listing_id)`

Pins a product to a live session (max 5 products).

```sql
SELECT pin_product_to_session('session-uuid', 'listing-uuid');
```

### `unpin_product_from_session(session_id, listing_id)`

Unpins a product from a live session.

```sql
SELECT unpin_product_from_session('session-uuid', 'listing-uuid');
```

## Requirements Mapping

- **Requirement 2.1**: Verified sellers can broadcast live video sessions
- **Requirement 2.2**: Display real-time viewer count during broadcast
- **Requirement 2.3**: Live chat interface for viewers
- **Requirement 2.4**: Sellers can pin up to 5 products during live session
- **Requirement 2.5**: Display product cards with price and buy button
- **Requirement 2.6**: Allow immediate purchase without leaving live session
- **Requirement 2.7**: Send push notifications to followers when seller goes live
- **Requirement 2.8**: Record live sessions and make available for 24 hours
- **Requirement 2.9**: Limit live session duration to 120 minutes maximum
- **Requirement 2.10**: AI moderation can flag or terminate sessions

## Security

### Row Level Security (RLS)

- Anyone can view live or ended sessions
- Users can view their own sessions (any status)
- Only verified sellers can create sessions
- Users can update/delete their own sessions
- Authenticated users can send chat messages
- Session owners can delete any message in their session

### Constraints

- Maximum 5 pinned products per session
- Maximum 120 minutes session duration
- Recording expires 24 hours after broadcast ends

## Real-time Features

Use Supabase Realtime for:

1. **Live Chat**: Subscribe to `live_chat_messages` table
2. **Viewer Count**: Subscribe to `live_sessions` table updates
3. **Pinned Products**: Subscribe to `live_sessions.pinned_products` changes

Example subscription:

```typescript
const subscription = supabase
  .channel("live-session")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "live_chat_messages",
      filter: `session_id=eq.${sessionId}`,
    },
    (payload) => {
      console.log("New chat message:", payload);
    },
  )
  .subscribe();
```

## Next Steps

1. Implement API endpoints (Task 20)
2. Create UI components for live streaming
3. Set up push notifications for followers
4. Integrate AI moderation for content filtering
5. Implement recording storage and playback
6. Add analytics tracking for live sessions

## Production Considerations

1. **CDN**: Use CDN for stream delivery to reduce latency
2. **Transcoding**: Set up adaptive bitrate streaming for different network conditions
3. **Recording Storage**: Use cloud storage (Supabase Storage or S3) for recordings
4. **Monitoring**: Track stream health, viewer experience, and error rates
5. **Scaling**: Consider edge servers for global distribution
6. **Backup**: Have fallback streaming service in case of primary service issues
