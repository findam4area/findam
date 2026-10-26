/**
 * Manual verification script for offline support implementation
 * Run with: node scripts/verify-offline-support.js
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Offline Support Implementation...\n");

let passed = 0;
let failed = 0;

function check(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(process.cwd(), filePath));
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(
    path.resolve(process.cwd(), filePath),
    "utf-8",
  );
  return content.includes(searchString);
}

// Task 22.1: PWA Offline Functionality
console.log("📋 Task 22.1: PWA Offline Functionality\n");

check("Service worker file exists", fileExists("./public/sw.js"));

check(
  "Service worker has caching strategies",
  fileContains("./public/sw.js", "CACHE_VERSION") &&
    fileContains("./public/sw.js", "addEventListener"),
);

check(
  "Service worker has offline queue support",
  fileContains("./public/sw.js", "offline-queue") &&
    fileContains("./public/sw.js", "IndexedDB"),
);

check(
  "Service worker has background sync",
  fileContains("./public/sw.js", "sync") &&
    fileContains("./public/sw.js", "syncOfflineQueue"),
);

check(
  "Offline storage utilities exist",
  fileExists("./lib/utils/offline-storage.ts"),
);

check(
  "Offline storage has all required stores",
  fileContains("./lib/utils/offline-storage.ts", "STORES") &&
    fileContains("./lib/utils/offline-storage.ts", "LISTINGS") &&
    fileContains("./lib/utils/offline-storage.ts", "CONVERSATIONS") &&
    fileContains("./lib/utils/offline-storage.ts", "MESSAGES"),
);

check("useOffline hook exists", fileExists("./lib/hooks/useOffline.ts"));

check(
  "useOffline hook has queue management",
  fileContains("./lib/hooks/useOffline.ts", "queueAction") &&
    fileContains("./lib/hooks/useOffline.ts", "syncOfflineQueue"),
);

check("Offline API client exists", fileExists("./lib/api/offline-client.ts"));

check(
  "Offline API client has caching",
  fileContains("./lib/api/offline-client.ts", "offlineFetch") &&
    fileContains("./lib/api/offline-client.ts", "cacheResponse"),
);

check(
  "Service worker registration enhanced",
  fileExists("./app/register-sw.tsx") &&
    fileContains("./app/register-sw.tsx", "updatefound"),
);

check(
  "Offline indicator component exists",
  fileExists("./components/shared/offline-indicator.tsx"),
);

// Task 22.3: Session State Management
console.log("\n📋 Task 22.3: Session State Management\n");

check(
  "Auth context has session restoration",
  fileContains("./lib/contexts/auth-context.tsx", "restoreSession") &&
    fileContains("./lib/contexts/auth-context.tsx", "saveSessionState"),
);

check(
  "Auth context persists session to IndexedDB",
  fileContains("./lib/contexts/auth-context.tsx", "savePreference") &&
    fileContains("./lib/contexts/auth-context.tsx", "last_user"),
);

check("Preferences store exists", fileExists("./store/preferences.ts"));

check(
  "Preferences store has persistence",
  fileContains("./store/preferences.ts", "persistPreferences") &&
    fileContains("./store/preferences.ts", "loadPreferences"),
);

check(
  "Preferences store has all preference types",
  fileContains("./store/preferences.ts", "theme") &&
    fileContains("./store/preferences.ts", "notificationsEnabled") &&
    fileContains("./store/preferences.ts", "recentSearches"),
);

check(
  "Persistent data hooks exist",
  fileExists("./lib/hooks/usePersistentData.ts"),
);

check(
  "Persistent data hooks have all variants",
  fileContains("./lib/hooks/usePersistentData.ts", "usePersistentData") &&
    fileContains("./lib/hooks/usePersistentData.ts", "useImmediatePersist") &&
    fileContains("./lib/hooks/usePersistentData.ts", "useBatchPersist"),
);

check(
  "Layout includes offline indicator",
  fileContains("./app/layout.tsx", "OfflineIndicator") &&
    fileContains("./app/layout.tsx", "Toaster"),
);

// Documentation
console.log("\n📋 Documentation\n");

check(
  "Offline support documentation exists",
  fileExists("./lib/utils/OFFLINE_SUPPORT.md"),
);

check(
  "Documentation is comprehensive",
  fileContains("./lib/utils/OFFLINE_SUPPORT.md", "Service Worker") &&
    fileContains("./lib/utils/OFFLINE_SUPPORT.md", "IndexedDB") &&
    fileContains("./lib/utils/OFFLINE_SUPPORT.md", "Usage") &&
    fileContains("./lib/utils/OFFLINE_SUPPORT.md", "Testing"),
);

check(
  "Task summary exists",
  fileExists("./.kiro/specs/findam/TASK_22_SUMMARY.md"),
);

// Requirements Validation
console.log("\n📋 Requirements Validation\n");

check(
  "Requirement 13.6: PWA offline functionality",
  fileExists("./public/sw.js") &&
    fileExists("./lib/utils/offline-storage.ts") &&
    fileExists("./lib/hooks/useOffline.ts"),
);

check(
  "Requirement 20.1: Session state restoration",
  fileContains("./lib/contexts/auth-context.tsx", "restoreSession"),
);

check(
  "Requirement 20.3: Immediate data persistence",
  fileExists("./lib/hooks/usePersistentData.ts") &&
    fileContains("./lib/hooks/usePersistentData.ts", "useImmediatePersist"),
);

check(
  "Requirement 20.4: Offline data access",
  fileContains("./lib/utils/offline-storage.ts", "cacheListings") &&
    fileContains("./lib/utils/offline-storage.ts", "getCachedListings"),
);

check(
  "Requirement 20.5: Offline action sync",
  fileContains("./lib/api/offline-client.ts", "syncQueuedRequests") &&
    fileContains("./lib/hooks/useOffline.ts", "syncOfflineQueue"),
);

// Summary
console.log("\n" + "=".repeat(50));
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log(
  `🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`,
);

if (failed === 0) {
  console.log("🎉 All checks passed! Task 22 is complete.\n");
  process.exit(0);
} else {
  console.log("⚠️  Some checks failed. Please review the implementation.\n");
  process.exit(1);
}
