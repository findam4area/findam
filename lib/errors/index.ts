// Custom error classes
export {
  AppError,
  APIError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PaymentError,
  NetworkError,
  DatabaseError,
  FileUploadError,
  isAppError,
  getUserFriendlyMessage,
  getErrorStatusCode,
} from "./custom-errors";

// Error tracking
export {
  initErrorTracker,
  getErrorTracker,
  trackError,
  trackMessage,
  setErrorTrackingUser,
  addBreadcrumb,
} from "./error-tracker";

// Error handling utilities
export {
  handleError,
  handleSuccess,
  handleInfo,
  handleWarning,
  handleLoading,
  dismissToast,
  handleAsyncOperation,
} from "./error-handler";

// Graceful degradation utilities
export {
  getCachedData,
  setCachedData,
  removeCachedData,
  fetchWithCacheFallback,
  retryWithBackoff,
  PollingFallback,
  getImageFallback,
  handleImageError,
  isFeatureAvailable,
  executeWithPartialFallback,
} from "./graceful-degradation";
