/**
 * Toast notification utilities using Sonner
 * Requirements: 3.1, 3.7, 4.2, 4.7
 * 
 * Provides consistent toast notifications across the application
 * with success, error, info, and warning variants.
 */

import { toast as sonnerToast } from 'sonner';

/**
 * Show a success toast notification
 * @param message - The message to display
 * @param description - Optional additional details
 */
export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show an error toast notification
 * @param message - The error message to display
 * @param description - Optional additional error details
 */
export function toastError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Show an info toast notification
 * @param message - The info message to display
 * @param description - Optional additional details
 */
export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show a warning toast notification
 * @param message - The warning message to display
 * @param description - Optional additional details
 */
export function toastWarning(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
    duration: 4500,
  });
}

/**
 * Show a loading toast notification that can be updated
 * @param message - The loading message to display
 * @returns Toast ID that can be used to update or dismiss the toast
 */
export function toastLoading(message: string) {
  return sonnerToast.loading(message);
}

/**
 * Show a promise toast that automatically updates based on promise state
 * @param promise - The promise to track
 * @param messages - Messages for loading, success, and error states
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return sonnerToast.promise(promise, messages);
}

/**
 * Dismiss a specific toast by ID
 * @param toastId - The ID of the toast to dismiss
 */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  sonnerToast.dismiss();
}

/**
 * Show a custom toast with full control
 * @param message - The message to display
 * @param options - Sonner toast options
 */
export function toast(message: string, options?: Parameters<typeof sonnerToast>[1]) {
  return sonnerToast(message, options);
}
