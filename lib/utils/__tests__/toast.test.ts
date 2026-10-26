/**
 * Unit tests for toast notification utilities
 * Requirements: 3.1, 3.7, 4.2, 4.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastLoading,
  toastPromise,
  dismissToast,
  dismissAllToasts,
  toast,
} from '../toast';
import { toast as sonnerToast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: Object.assign(
    vi.fn(),
    {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      loading: vi.fn(),
      promise: vi.fn(),
      dismiss: vi.fn(),
    }
  ),
}));

describe('Toast Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toastSuccess', () => {
    it('should call sonner success toast with message', () => {
      toastSuccess('Operation completed');

      expect(sonnerToast.success).toHaveBeenCalledWith('Operation completed', {
        description: undefined,
        duration: 4000,
      });
    });

    it('should call sonner success toast with message and description', () => {
      toastSuccess('User created', 'Welcome to the platform');

      expect(sonnerToast.success).toHaveBeenCalledWith('User created', {
        description: 'Welcome to the platform',
        duration: 4000,
      });
    });
  });

  describe('toastError', () => {
    it('should call sonner error toast with message', () => {
      toastError('Something went wrong');

      expect(sonnerToast.error).toHaveBeenCalledWith('Something went wrong', {
        description: undefined,
        duration: 5000,
      });
    });

    it('should call sonner error toast with message and description', () => {
      toastError('Failed to save', 'Please try again');

      expect(sonnerToast.error).toHaveBeenCalledWith('Failed to save', {
        description: 'Please try again',
        duration: 5000,
      });
    });
  });

  describe('toastInfo', () => {
    it('should call sonner info toast with message', () => {
      toastInfo('New update available');

      expect(sonnerToast.info).toHaveBeenCalledWith('New update available', {
        description: undefined,
        duration: 4000,
      });
    });

    it('should call sonner info toast with message and description', () => {
      toastInfo('Maintenance scheduled', 'System will be down tomorrow');

      expect(sonnerToast.info).toHaveBeenCalledWith('Maintenance scheduled', {
        description: 'System will be down tomorrow',
        duration: 4000,
      });
    });
  });

  describe('toastWarning', () => {
    it('should call sonner warning toast with message', () => {
      toastWarning('Unsaved changes');

      expect(sonnerToast.warning).toHaveBeenCalledWith('Unsaved changes', {
        description: undefined,
        duration: 4500,
      });
    });

    it('should call sonner warning toast with message and description', () => {
      toastWarning('Low storage', 'You have less than 10% remaining');

      expect(sonnerToast.warning).toHaveBeenCalledWith('Low storage', {
        description: 'You have less than 10% remaining',
        duration: 4500,
      });
    });
  });

  describe('toastLoading', () => {
    it('should call sonner loading toast and return toast id', () => {
      const mockToastId = 'toast-123';
      vi.mocked(sonnerToast.loading).mockReturnValue(mockToastId as any);

      const result = toastLoading('Processing...');

      expect(sonnerToast.loading).toHaveBeenCalledWith('Processing...');
      expect(result).toBe(mockToastId);
    });
  });

  describe('toastPromise', () => {
    it('should call sonner promise toast with messages', async () => {
      const mockPromise = Promise.resolve('data');
      const messages = {
        loading: 'Saving...',
        success: 'Saved successfully',
        error: 'Failed to save',
      };

      toastPromise(mockPromise, messages);

      expect(sonnerToast.promise).toHaveBeenCalledWith(mockPromise, messages);
    });

    it('should handle promise with function messages', async () => {
      const mockPromise = Promise.resolve('data');
      const messages = {
        loading: 'Loading...',
        success: (data: string) => `Loaded ${data}`,
        error: (err: any) => `Error: ${err.message}`,
      };

      toastPromise(mockPromise, messages);

      expect(sonnerToast.promise).toHaveBeenCalledWith(mockPromise, messages);
    });
  });

  describe('dismissToast', () => {
    it('should call sonner dismiss with toast id', () => {
      dismissToast('toast-123');

      expect(sonnerToast.dismiss).toHaveBeenCalledWith('toast-123');
    });

    it('should handle numeric toast ids', () => {
      dismissToast(456);

      expect(sonnerToast.dismiss).toHaveBeenCalledWith(456);
    });
  });

  describe('dismissAllToasts', () => {
    it('should call sonner dismiss without parameters', () => {
      dismissAllToasts();

      expect(sonnerToast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('toast', () => {
    it('should call sonner toast with message', () => {
      toast('Custom message');

      expect(sonnerToast).toHaveBeenCalledWith('Custom message', undefined);
    });

    it('should call sonner toast with message and options', () => {
      const options = { duration: 3000, position: 'top-center' as const };
      toast('Custom message', options);

      expect(sonnerToast).toHaveBeenCalledWith('Custom message', options);
    });
  });

  describe('Duration configuration', () => {
    it('should use correct duration for success toasts (4s)', () => {
      toastSuccess('Success');
      
      const callArgs = vi.mocked(sonnerToast.success).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('duration', 4000);
    });

    it('should use correct duration for error toasts (5s)', () => {
      toastError('Error');
      
      const callArgs = vi.mocked(sonnerToast.error).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('duration', 5000);
    });

    it('should use correct duration for info toasts (4s)', () => {
      toastInfo('Info');
      
      const callArgs = vi.mocked(sonnerToast.info).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('duration', 4000);
    });

    it('should use correct duration for warning toasts (4.5s)', () => {
      toastWarning('Warning');
      
      const callArgs = vi.mocked(sonnerToast.warning).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('duration', 4500);
    });
  });
});
