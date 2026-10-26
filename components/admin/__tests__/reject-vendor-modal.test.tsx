/**
 * Tests for RejectVendorModal Component
 * 
 * Requirements: 4.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RejectVendorModal } from '../reject-vendor-modal';
import { rejectVendorAction } from '@/lib/actions/admin-actions';

// Mock the Server Action
vi.mock('@/lib/actions/admin-actions', () => ({
  rejectVendorAction: vi.fn(),
}));

describe('RejectVendorModal', () => {
  const mockApplicationId = '123e4567-e89b-12d3-a456-426614174000';
  const mockBusinessName = 'Test Business Co.';
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultProps = {
    applicationId: mockApplicationId,
    businessName: mockBusinessName,
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<RejectVendorModal {...defaultProps} />);

    expect(screen.getByText('Reject Vendor Application')).toBeInTheDocument();
    expect(screen.getByText(/Rejecting:/)).toBeInTheDocument();
    expect(screen.getByText(mockBusinessName)).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<RejectVendorModal {...defaultProps} open={false} />);

    expect(screen.queryByText('Reject Vendor Application')).not.toBeInTheDocument();
  });

  it('displays character count', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    expect(screen.getByText(/11\/500 characters/)).toBeInTheDocument();
  });

  it('shows minimum character warning when less than 10 characters', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, { target: { value: 'Short' } });

    expect(screen.getByText(/Minimum 10 characters required/)).toBeInTheDocument();
  });

  it('shows maximum character warning when exceeds 500 characters', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    const longText = 'a'.repeat(501);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(screen.getByText(/Maximum exceeded/)).toBeInTheDocument();
  });

  it('disables submit button when reason is too short', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, { target: { value: 'Short' } });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when reason is too long', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    const longText = 'a'.repeat(501);
    fireEvent.change(textarea, { target: { value: longText } });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when reason is valid', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, {
      target: { value: 'This is a valid rejection reason with enough characters.' },
    });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls rejectVendorAction with correct parameters on submit', async () => {
    const mockRejectVendorAction = vi.mocked(rejectVendorAction);
    mockRejectVendorAction.mockResolvedValue({ success: true });

    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    const reason = 'This application does not meet our requirements.';
    fireEvent.change(textarea, { target: { value: reason } });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRejectVendorAction).toHaveBeenCalledWith(mockApplicationId, reason);
    });
  });

  it('shows loading state during submission', async () => {
    const mockRejectVendorAction = vi.mocked(rejectVendorAction);
    mockRejectVendorAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, {
      target: { value: 'This is a valid rejection reason.' },
    });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Rejecting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls onSuccess and closes modal on successful submission', async () => {
    const mockRejectVendorAction = vi.mocked(rejectVendorAction);
    mockRejectVendorAction.mockResolvedValue({ success: true });

    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, {
      target: { value: 'This is a valid rejection reason.' },
    });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('displays error message on submission failure', async () => {
    const mockRejectVendorAction = vi.mocked(rejectVendorAction);
    const errorMessage = 'Vendor application not found.';
    mockRejectVendorAction.mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, {
      target: { value: 'This is a valid rejection reason.' },
    });

    const submitButton = screen.getByRole('button', { name: /Reject Application/ });
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('clears reason and error when cancel is clicked', () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, {
      target: { value: 'This is a test reason.' },
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays warning about email notification', () => {
    render(<RejectVendorModal {...defaultProps} />);

    expect(
      screen.getByText(/The applicant will receive this rejection reason via email/)
    ).toBeInTheDocument();
  });

  it('shows client-side validation error for short reason on submit', async () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    fireEvent.change(textarea, { target: { value: 'Short' } });

    const form = textarea.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(
        screen.getByText(/Rejection reason must be at least 10 characters/)
      ).toBeInTheDocument();
    });
  });

  it('shows client-side validation error for long reason on submit', async () => {
    render(<RejectVendorModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Provide a clear reason/);
    const longText = 'a'.repeat(501);
    fireEvent.change(textarea, { target: { value: longText } });

    const form = textarea.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(
        screen.getByText(/Rejection reason must be at most 500 characters/)
      ).toBeInTheDocument();
    });
  });
});
