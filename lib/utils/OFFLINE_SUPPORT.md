# Offline Support Documentation

## Overview

FindAm implements comprehensive offline support using Progressive Web App (PWA) technologies, including Service Workers, IndexedDB, and intelligent caching strategies. This ensures users can access cached content and queue actions when offline, with automatic synchronization when connectivity is restored.

## Architecture

### Service Worker (`public/sw.js`)

The service worker implements multiple caching strategies:

1. **Static Assets Cache**: Pre-caches essential app files on install
2. **Runtime Cache**: Caches pages and assets as they're accessed
3. **Image Cache**: Dedicated cache for images with fallback placeholder
4. **API Cache**: Network-first strategy with cache fallback for API requests

### IndexedDB Storage (`lib/utils/offline-storage.ts`)

Provides persistent storage with the following stores:

- `listings`: Cached listing data
- `conversations`: Cached conversation data
- `messages`: Cached message data
- `notifications`: Cached notifications
- `user-preferences`: User preferences and settings
- `offline-queue`: Queued actions for sync when online

### Offline-Aware API Client (`lib/api/offline-client.ts`)

Wraps fetch requests with offline support:

- Automatically caches GET responses
- Queues mutations when offline
- Returns cached data when network unavailable
- Syncs queued actions when online

## Usage

### Using the Offline Hook

```typescript
import { useOffline } from "@/lib/hooks/useOffline";

function MyComponent() {
  const { isOnline, queuedActions, queueAction, syncOfflineQueue } = useOffline();

  // Check online status
  if (!isOnline) {
    return <div>You're offline</div>;
  }

  // Queue an action for later sync
  const handleAction = async () => {
    if (!isOnline) {
      await queueAction("/api/listings", "POST", { title: "New Listing" });
    }
  };

  return <div>Online: {queuedActions.length} actions queued</div>;
}
```

### Using Offline-Aware Fetch

```typescript
import { offlineFetch } from "@/lib/api/offline-client";

// Fetch with automatic caching and offline support
const listings = await offlineFetch<Listing[]>("/api/listings");

// Queue mutation if offline
await offlineFetch("/api/listings", {
  method: "POST",
  body: JSON.stringify(newListing),
  queueIfOffline: true,
});
```

### Using Persistent Data Hook

```typescript
import { usePersistentData } from "@/lib/hooks/usePersistentData";

function ProfileEditor() {
  const [profile, setProfile] = useState(initialProfile);

  // Automatically persist changes with debouncing
  usePersistentData(profile, async (data) => {
    await fetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }, {
    debounceMs: 1000,
    onSuccess: () => toast.success("Saved"),
    onError: (error) => toast.error("Failed to save"),
  });

  return <input onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />;
}
```

### Using Preferences Store

```typescript
import { usePreferencesStore } from "@/store/preferences";

function Settings() {
  const { theme, setTheme, autoPlayVideos, setAutoPlayVideos } = usePreferencesStore();

  // Preferences are automatically persisted to IndexedDB
  return (
    <div>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        Toggle Theme
      </button>
      <input
        type="checkbox"
        checked={autoPlayVideos}
        onChange={(e) => setAutoPlayVideos(e.target.checked)}
      />
    </div>
  );
}
```

## Session State Management

### Session Restoration

The auth context automatically restores session state on login:

```typescript
import { useAuth } from "@/lib/contexts/auth-context";

function App() {
  const { user, restoreSession } = useAuth();

  useEffect(() => {
    // Session is automatically restored on mount
    // Manual restoration can be triggered if needed
    restoreSession();
  }, []);

  return <div>Welcome {user?.username}</div>;
}
```

### Preference Persistence

User preferences are persisted to both localStorage (via Zustand) and IndexedDB:

- **localStorage**: Fast access for immediate UI updates
- **IndexedDB**: Reliable persistence across sessions

## Offline Queue Synchronization

### Automatic Sync

When the user comes back online, queued actions are automatically synced:

1. Service worker detects online event
2. Background sync is triggered (if supported)
3. Queued requests are executed in order
4. Successfully synced actions are removed from queue
5. User is notified of sync status

### Manual Sync

Users can manually trigger sync via the offline indicator:

```typescript
const { syncOfflineQueue } = useOffline();

<button onClick={syncOfflineQueue}>Sync Now</button>
```

## Caching Strategies

### Static Assets

- **Strategy**: Cache-first
- **Update**: On service worker update
- **Includes**: HTML, CSS, JS, manifest, icons

### API Requests

- **Strategy**: Network-first with cache fallback
- **Cacheable**: Listings, categories, search results
- **Non-cacheable**: Auth, payments, webhooks

### Images

- **Strategy**: Cache-first with network fallback
- **Fallback**: SVG placeholder when offline
- **Cache**: Separate image cache with size limits

### User Data

- **Strategy**: Network-first with IndexedDB fallback
- **Includes**: Profile, preferences, saved items
- **Sync**: Automatic on reconnection

## Best Practices

### 1. Always Check Online Status

```typescript
if (!navigator.onLine) {
  // Show offline UI or queue action
}
```

### 2. Provide Offline Feedback

```typescript
import { OfflineIndicator } from "@/components/shared/offline-indicator";

// Already included in root layout
<OfflineIndicator />
```

### 3. Queue Critical Actions

```typescript
await offlineFetch("/api/critical-action", {
  method: "POST",
  queueIfOffline: true, // Ensures action is queued if offline
});
```

### 4. Handle Sync Failures Gracefully

```typescript
usePersistentData(data, saveFn, {
  retryAttempts: 3,
  onError: (error) => {
    // Show user-friendly error
    toast.error("Changes couldn't be saved. Please try again.");
  },
});
```

### 5. Clear Sensitive Data on Logout

```typescript
// Auth context automatically clears session state
// Optionally clear cached data:
await clearStore(STORES.LISTINGS);
await clearStore(STORES.MESSAGES);
```

## Testing Offline Functionality

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Test app functionality

### Service Worker Testing

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Verify caching behavior
4. Test update flow

### IndexedDB Inspection

1. Open DevTools → Application → IndexedDB
2. Expand "findam-offline" database
3. Inspect stored data in each store
4. Verify data persistence

## Troubleshooting

### Service Worker Not Registering

- Check that app is served over HTTPS (or localhost)
- Verify `sw.js` is in public directory
- Check browser console for errors

### Data Not Persisting

- Verify IndexedDB is not disabled in browser
- Check storage quota hasn't been exceeded
- Ensure data is being saved with correct store name

### Sync Not Working

- Verify online event is firing
- Check queued actions in IndexedDB
- Ensure Background Sync API is supported (fallback to manual sync)

### Cache Not Updating

- Increment CACHE_VERSION in service worker
- Clear browser cache manually
- Verify service worker update flow

## Performance Considerations

### Cache Size Management

- Images are cached separately with size limits
- Old caches are automatically cleaned on activation
- Consider implementing cache expiration for stale data

### IndexedDB Limits

- Browser storage quota varies by browser
- Monitor storage usage with Storage API
- Implement cleanup for old data

### Sync Performance

- Batch queued actions when possible
- Implement exponential backoff for retries
- Prioritize critical actions in sync queue

## Future Enhancements

1. **Differential Sync**: Only sync changed data
2. **Conflict Resolution**: Handle concurrent edits
3. **Selective Sync**: Allow users to choose what to sync
4. **Background Fetch**: Download large files in background
5. **Push Notifications**: Notify users of sync completion
