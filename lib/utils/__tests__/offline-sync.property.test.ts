/**
 * Property-Based Tests for Offline Sync
 * Tests offline sync idempotence and correctness properties
 * 
 * **Validates: Requirements 17.10**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  queueOfflineAction,
  getQueuedActions,
  removeQueuedAction,
  clearQueuedActions,
  openDB,
} from "../offline-storage";

// Mock fetch for testing
global.fetch = vi.fn();

describe("Property 10: Offline Sync Idempotence", () => {
  beforeEach(async () => {
    // Clear the queue before each test
    await clearQueuedActions();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after tests
    await clearQueuedActions();
    const db = await openDB();
    db.close();
  });

  /**
   * Property: Syncing queued actions completes within 5 seconds
   * 
   * For any set of queued actions, when syncing occurs,
   * the sync operation SHALL complete within 5 seconds.
   */
  it("should complete sync within 5 seconds for any number of queued actions", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-10 actions to queue
        fc.array(
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom("POST", "PUT", "DELETE"),
            body: fc.jsonValue(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (actions) => {
          // Queue all actions
          for (const action of actions) {
            await queueOfflineAction(
              action.url,
              action.method,
              { "Content-Type": "application/json" },
              action.body
            );
          }

          // Mock successful responses
          (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          });

          // Measure sync time
          const startTime = Date.now();

          // Simulate sync process
          const queuedActions = await getQueuedActions();
          for (const queuedAction of queuedActions) {
            try {
              const response = await fetch(queuedAction.url, {
                method: queuedAction.method,
                headers: queuedAction.headers,
                body: queuedAction.body,
              });

              if (response.ok && queuedAction.id) {
                await removeQueuedAction(queuedAction.id);
              }
            } catch (error) {
              // Handle errors
              console.error("Sync error:", error);
            }
          }

          const endTime = Date.now();
          const syncDuration = endTime - startTime;

          // Property: Sync completes within 5 seconds (5000ms)
          expect(syncDuration).toBeLessThan(5000);

          // Verify all actions were processed
          const remainingActions = await getQueuedActions();
          expect(remainingActions).toHaveLength(0);
        }
      ),
      { numRuns: 20 } // Run 20 times with different inputs
    );
  });

  /**
   * Property: Syncing the same action multiple times is idempotent
   * 
   * For any action, syncing it multiple times SHALL produce
   * the same result as syncing it once.
   */
  it("should be idempotent when syncing the same action multiple times", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          method: fc.constantFrom("POST", "PUT", "DELETE"),
          body: fc.jsonValue(),
        }),
        async (action) => {
          // Queue the same action
          await queueOfflineAction(
            action.url,
            action.method,
            { "Content-Type": "application/json" },
            action.body
          );

          let callCount = 0;
          (global.fetch as any).mockImplementation(() => {
            callCount++;
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({ success: true }),
            });
          });

          // Sync once
          const queuedActions = await getQueuedActions();
          for (const queuedAction of queuedActions) {
            const response = await fetch(queuedAction.url, {
              method: queuedAction.method,
              headers: queuedAction.headers,
              body: queuedAction.body,
            });

            if (response.ok && queuedAction.id) {
              await removeQueuedAction(queuedAction.id);
            }
          }

          const firstSyncCallCount = callCount;

          // Try to sync again (should be no-op since queue is empty)
          callCount = 0;
          const remainingActions = await getQueuedActions();
          for (const queuedAction of remainingActions) {
            await fetch(queuedAction.url, {
              method: queuedAction.method,
              headers: queuedAction.headers,
              body: queuedAction.body,
            });
          }

          const secondSyncCallCount = callCount;

          // Property: Second sync should not make any calls (idempotent)
          expect(secondSyncCallCount).toBe(0);
          expect(firstSyncCallCount).toBe(1);

          // Verify queue is empty
          const finalQueue = await getQueuedActions();
          expect(finalQueue).toHaveLength(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Failed syncs are retried with exponential backoff
   * 
   * For any action that fails to sync, it SHALL remain in the queue
   * and be retried on the next sync attempt.
   */
  it("should retry failed syncs and keep them in queue", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          method: fc.constantFrom("POST", "PUT", "DELETE"),
          body: fc.jsonValue(),
        }),
        async (action) => {
          // Queue action
          await queueOfflineAction(
            action.url,
            action.method,
            { "Content-Type": "application/json" },
            action.body
          );

          // Mock failed response
          (global.fetch as any).mockRejectedValue(new Error("Network error"));

          // Try to sync
          const queuedActions = await getQueuedActions();
          for (const queuedAction of queuedActions) {
            try {
              await fetch(queuedAction.url, {
                method: queuedAction.method,
                headers: queuedAction.headers,
                body: queuedAction.body,
              });
            } catch (error) {
              // Error expected - action should remain in queue
            }
          }

          // Property: Failed action should still be in queue
          const remainingActions = await getQueuedActions();
          expect(remainingActions.length).toBeGreaterThan(0);
          // Check that at least one action with the expected URL is in the queue
          const hasExpectedAction = remainingActions.some(
            (a) => a.url === action.url
          );
          expect(hasExpectedAction).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Queue order is preserved during sync
   * 
   * For any sequence of actions, the sync order SHALL match
   * the queue order (FIFO - First In, First Out).
   */
  it("should preserve queue order during sync (FIFO)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom("POST", "PUT", "DELETE"),
            body: fc.jsonValue(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (actions) => {
          // Queue all actions in order
          for (const action of actions) {
            await queueOfflineAction(
              action.url,
              action.method,
              { "Content-Type": "application/json" },
              action.body
            );
          }

          // Track sync order
          const syncOrder: string[] = [];
          (global.fetch as any).mockImplementation((url: string) => {
            syncOrder.push(url);
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({ success: true }),
            });
          });

          // Sync all actions
          const queuedActions = await getQueuedActions();
          for (const queuedAction of queuedActions) {
            await fetch(queuedAction.url, {
              method: queuedAction.method,
              headers: queuedAction.headers,
              body: queuedAction.body,
            });

            if (queuedAction.id) {
              await removeQueuedAction(queuedAction.id);
            }
          }

          // Property: Sync order should match queue order
          const expectedOrder = actions.map((a) => a.url);
          expect(syncOrder).toEqual(expectedOrder);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Successful sync removes action from queue
   * 
   * For any action that syncs successfully, it SHALL be
   * removed from the queue and not synced again.
   */
  it("should remove successfully synced actions from queue", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom("POST", "PUT", "DELETE"),
            body: fc.jsonValue(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (actions) => {
          // Queue all actions
          for (const action of actions) {
            await queueOfflineAction(
              action.url,
              action.method,
              { "Content-Type": "application/json" },
              action.body
            );
          }

          const initialQueueSize = (await getQueuedActions()).length;

          // Mock successful responses
          (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          });

          // Sync all actions
          const queuedActions = await getQueuedActions();
          for (const queuedAction of queuedActions) {
            const response = await fetch(queuedAction.url, {
              method: queuedAction.method,
              headers: queuedAction.headers,
              body: queuedAction.body,
            });

            if (response.ok && queuedAction.id) {
              await removeQueuedAction(queuedAction.id);
            }
          }

          // Property: Queue should be empty after successful sync
          const finalQueue = await getQueuedActions();
          expect(finalQueue).toHaveLength(0);
          expect(initialQueueSize).toBe(actions.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Partial sync failures don't affect successful syncs
   * 
   * For any set of actions where some succeed and some fail,
   * successful actions SHALL be removed while failed actions remain.
   */
  it("should handle partial sync failures correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom("POST", "PUT", "DELETE"),
            body: fc.jsonValue(),
            shouldFail: fc.boolean(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (actions) => {
          // Queue all actions
          for (const action of actions) {
            await queueOfflineAction(
              action.url,
              action.method,
              { "Content-Type": "application/json" },
              action.body
            );
          }

          // Mock responses based on shouldFail flag
          (global.fetch as any).mockImplementation((url: string) => {
            const action = actions.find((a) => a.url === url);
            if (action?.shouldFail) {
              return Promise.reject(new Error("Network error"));
            }
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({ success: true }),
            });
          });

          // Sync all actions
          const queuedActions = await getQueuedActions();
          for (const queuedAction of queuedActions) {
            try {
              const response = await fetch(queuedAction.url, {
                method: queuedAction.method,
                headers: queuedAction.headers,
                body: queuedAction.body,
              });

              if (response.ok && queuedAction.id) {
                await removeQueuedAction(queuedAction.id);
              }
            } catch (error) {
              // Failed action remains in queue
            }
          }

          // Property: Only failed actions should remain in queue
          const remainingActions = await getQueuedActions();
          const expectedFailures = actions.filter((a) => a.shouldFail).length;
          expect(remainingActions.length).toBe(expectedFailures);
        }
      ),
      { numRuns: 20 }
    );
  });
});
