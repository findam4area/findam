import { toast } from "sonner";
import { trackError } from "./error-tracker";
import {
  getUserFriendlyMessage,
  isAppError,
  ValidationError,
} from "./custom-errors";

/**
 * Handle errors with toast notifications
 */
export function handleError(error: unknown, customMessage?: string): void {
  // Track the error
  if (error instanceof Error) {
    trackError(error);
  }

  // Get user-friendly message
  const message = customMessage || getUserFriendlyMessage(error);

  // Show appropriate toast based on error type
  if (isAppError(error)) {
    if (error instanceof ValidationError) {
      // Show validation errors
      const errorMessages = Object.values(error.errors).flat();
      if (errorMessages.length > 0) {
        toast.error(message, {
          description: errorMessages.join(", "),
        });
      } else {
        toast.error(message);
      }
    } else if (error.statusCode >= 500) {
      // Server errors
      toast.error("Server Error", {
        description: message,
      });
    } else if (error.statusCode === 401) {
      // Authentication errors
      toast.error("Authentication Required", {
        description: message,
      });
    } else if (error.statusCode === 403) {
      // Authorization errors
      toast.error("Access Denied", {
        description: message,
      });
    } else if (error.statusCode === 404) {
      // Not found errors
      toast.error("Not Found", {
        description: message,
      });
    } else if (error.statusCode === 429) {
      // Rate limit errors
      toast.warning("Rate Limit Exceeded", {
        description: message,
      });
    } else {
      // Other client errors
      toast.error(message);
    }
  } else {
    // Unknown errors
    toast.error(message);
  }
}

/**
 * Handle success with toast notification
 */
export function handleSuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
  });
}

/**
 * Handle info with toast notification
 */
export function handleInfo(message: string, description?: string): void {
  toast.info(message, {
    description,
  });
}

/**
 * Handle warning with toast notification
 */
export function handleWarning(message: string, description?: string): void {
  toast.warning(message, {
    description,
  });
}

/**
 * Handle loading state with toast
 */
export function handleLoading(message: string): string | number {
  return toast.loading(message);
}

/**
 * Dismiss toast
 */
export function dismissToast(toastId: string | number): void {
  toast.dismiss(toastId);
}

/**
 * Handle async operation with loading and error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options?: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  },
): Promise<T | null> {
  let toastId: string | number | undefined;

  try {
    // Show loading toast
    if (options?.loadingMessage) {
      toastId = handleLoading(options.loadingMessage);
    }

    // Execute operation
    const result = await operation();

    // Dismiss loading toast
    if (toastId) {
      dismissToast(toastId);
    }

    // Show success toast
    if (options?.successMessage) {
      handleSuccess(options.successMessage);
    }

    // Call success callback
    if (options?.onSuccess) {
      options.onSuccess(result);
    }

    return result;
  } catch (error) {
    // Dismiss loading toast
    if (toastId) {
      dismissToast(toastId);
    }

    // Handle error
    handleError(error, options?.errorMessage);

    // Call error callback
    if (options?.onError) {
      options.onError(error);
    }

    return null;
  }
}
