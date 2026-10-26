/**
 * ProfileEditForm Component Tests
 * 
 * Unit tests for profile edit functionality
 * 
 * Requirements: 2.7, 13.13
 * Task: 10.6 Create user profile edit functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileEditForm } from './profile-edit-form';
import type { User } from '@/lib/types/core';

// Mock the server actions
vi.mock('@/lib/actions/user-actions', () => ({
  updateProfileAction: vi.fn(),
}));

vi.mock('@/app/actions/profile', () => ({
  uploadAvatarAction: vi.fn(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  phone: '+2348012345678',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  role: 'user',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ProfileEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with user data pre-filled', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('+2348012345678');
    expect(screen.getByRole('img', { name: /profile avatar/i })).toHaveAttribute('src', mockUser.avatar_url);
  });

  it('displays validation error when full name is too short', async () => {
    render(<ProfileEditForm user={mockUser} />);

    const fullNameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(fullNameInput, { target: { value: 'A' } });
    fireEvent.blur(fullNameInput);

    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid phone number format', async () => {
    render(<ProfileEditForm user={mockUser} />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '123456' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid nigerian phone number/i)).toBeInTheDocument();
    });
  });

  it('accepts valid Nigerian phone number formats', async () => {
    render(<ProfileEditForm user={mockUser} />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    
    // Test with +234 format
    fireEvent.change(phoneInput, { target: { value: '+2348012345678' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid nigerian phone number/i)).not.toBeInTheDocument();
    });

    // Test with 0 prefix format
    fireEvent.change(phoneInput, { target: { value: '08012345678' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid nigerian phone number/i)).not.toBeInTheDocument();
    });
  });

  it('allows empty phone number (optional field)', async () => {
    render(<ProfileEditForm user={mockUser} />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid nigerian phone number/i)).not.toBeInTheDocument();
    });
  });

  it('shows avatar upload button', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByRole('button', { name: /upload avatar/i })).toBeInTheDocument();
  });

  it('displays user initials when no avatar URL is provided', () => {
    const userWithoutAvatar = { ...mockUser, avatar_url: null };
    render(<ProfileEditForm user={userWithoutAvatar} />);

    // Check for the initial letter in the fallback avatar
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test User"
  });

  it('shows save and cancel buttons', () => {
    const onCancel = vi.fn();
    render(<ProfileEditForm user={mockUser} onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ProfileEditForm user={mockUser} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables form inputs while submitting', async () => {
    const { updateProfileAction } = await import('@/lib/actions/user-actions');
    
    // Mock a slow submission
    vi.mocked(updateProfileAction).mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<ProfileEditForm user={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Check that form is disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      expect(screen.getByLabelText(/phone number/i)).toBeDisabled();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<ProfileEditForm user={mockUser} />);

    const fullNameInput = screen.getByLabelText(/full name/i);
    const phoneInput = screen.getByLabelText(/phone number/i);

    // Check for required attribute on full name
    expect(fullNameInput).toBeRequired();

    // Check for proper ARIA attributes
    expect(phoneInput).toHaveAttribute('aria-describedby');
    expect(phoneInput).toHaveAttribute('type', 'tel');
  });

  it('displays helper text for phone number format', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByText(/format: \+234 followed by 10 digits/i)).toBeInTheDocument();
  });

  it('shows avatar size and format requirements', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByText(/max 2mb\. jpeg, png, or webp format\./i)).toBeInTheDocument();
  });
});
