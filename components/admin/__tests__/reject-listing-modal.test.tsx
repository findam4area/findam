/**
 * Tests for RejectListingModal Component
 * 
 * Tests cover:
 * - Component rendering
 * - Character count validation
 * - Form submission
 * - Error handling
 * - Loading states
 * 
 * Task: 8.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RejectListingModal } from '../reject-listing-modal';
import { rejectListingAction } from '@/lib/actions/admin-actions';

// Mock Server Action
vi.mock('@/lib/actions/admin-actions', () => ({
  rejectListingAction: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('RejectListingModal', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    listingId: 'test-listing-id',
    listingTitle: 'Test Listing Title',
    onRejectSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<RejectListingModal {...mockProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Test Listing Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rejection Reason/)).toBeInTheDocument();
  });

  it('does not render the modal when closed', () => {
    render(<RejectListingModal {...mockProps} open={false} />);

    expect(screen.queryByText('Reject Listing')).not.toBeInTheDocument();
  });

  it('displays character count', () => {
    render(<RejectListingModal {...mockProps} />);

    // Initial count should be 0/500
    expect(screen.getByText('0 / 500')).toBeInTheDocument();
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'Test reason');

    expect(screen.getByText('11 / 500')).toBeInTheDocument();
  });

  it('shows validation error when reason is too short', async () => {
    const user = userEvent.setup();
    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'Short');

    // Should show validation hint
    expect(
      screen.getByText(/Rejection reason must be at least 10 characters/)
    ).toBeInTheDocument();
  });

  it('disables submit button when reason is invalid', () => {
    render(<RejectListingModal {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when reason is valid', async () => {
    const user = userEvent.setup();
    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'This is a valid rejection reason');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    expect(submitButton).toBeEnabled();
  });

  it('shows error when reason exceeds max length', async () => {
    const user = userEvent.setup();
    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    const longText = 'a'.repeat(501);
    await user.type(textarea, longText);

    expect(
      screen.getByText(/Rejection reason must be at most 500 characters/)
    ).toBeInTheDocument();
  });

  it('submits form with valid reason', async () => {
    const user = userEvent.setup();
    const mockRejectAction = vi.mocked(rejectListingAction);
    mockRejectAction.mockResolvedValue({ success: true });

    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'This listing violates our content policy');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRejectAction).toHaveBeenCalledWith(
        'test-listing-id',
        'This listing violates our content policy'
      );
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockRejectAction = vi.mocked(rejectListingAction);
    mockRejectAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'This listing violates our content policy');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    // Should show loading text
    expect(screen.getByText('Rejecting...')).toBeInTheDocument();

    // Should disable form controls
    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('calls onRejectSuccess after successful submission', async () => {
    const user = userEvent.setup();
    const mockRejectAction = vi.mocked(rejectListingAction);
    mockRejectAction.mockResolvedValue({ success: true });

    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'This listing violates our content policy');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onRejectSuccess).toHaveBeenCalled();
    });
  });

  it('closes modal after successful submission', async () => {
    const user = userEvent.setup();
    const mockRejectAction = vi.mocked(rejectListingAction);
    mockRejectAction.mockResolvedValue({ success: true });

    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'This listing violates our content policy');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup();
    const mockRejectAction = vi.mocked(rejectListingAction);
    mockRejectAction.mockResolvedValue({
      success: false,
      error: 'Failed to reject listing',
    });

    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'This listing violates our content policy');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to reject listing')).toBeInTheDocument();
    });
  });

  it('resets form when modal is closed and reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, 'Some reason');

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    await user.click(cancelButton);

    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);

    // Reopen modal
    rerender(<RejectListingModal {...mockProps} open={false} />);
    rerender(<RejectListingModal {...mockProps} open={true} />);

    // Form should be reset
    const newTextarea = screen.getByLabelText(/Rejection Reason/);
    expect(newTextarea).toHaveValue('');
    expect(screen.getByText('0 / 500')).toBeInTheDocument();
  });

  it('trims whitespace from reason before submission', async () => {
    const user = userEvent.setup();
    const mockRejectAction = vi.mocked(rejectListingAction);
    mockRejectAction.mockResolvedValue({ success: true });

    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, '  This listing violates our content policy  ');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRejectAction).toHaveBeenCalledWith(
        'test-listing-id',
        'This listing violates our content policy'
      );
    });
  });

  it('prevents submission with only whitespace', async () => {
    const user = userEvent.setup();
    render(<RejectListingModal {...mockProps} />);

    const textarea = screen.getByLabelText(/Rejection Reason/);
    await user.type(textarea, '          ');

    const submitButton = screen.getByRole('button', { name: /Reject Listing/ });
    await user.click(submitButton);

    expect(screen.getByText('Please provide a rejection reason')).toBeInTheDocument();
  });
});
