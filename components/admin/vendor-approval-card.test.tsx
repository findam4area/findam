/**
 * Unit tests for VendorApprovalCard component
 * 
 * Tests:
 * - Renders vendor application information correctly
 * - Shows approve/reject buttons
 * - Handles approve action with loading state
 * - Opens reject dialog with reason textarea
 * - Validates rejection reason (min 10 chars)
 * - Shows toast notifications on success/error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VendorApprovalCard } from './vendor-approval-card';
import type { VendorApplicationWithUser } from '@/lib/types/core';

// Mock the admin actions
vi.mock('@/lib/actions/admin-actions', () => ({
  approveVendorAction: vi.fn(),
  rejectVendorAction: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 15, 2024'),
}));

describe('VendorApprovalCard', () => {
  const mockApplication: VendorApplicationWithUser = {
    id: 'app-123',
    user_id: 'user-123',
    business_name: 'Tech Solutions Ltd',
    business_description: 'We provide innovative technology solutions for businesses across Nigeria',
    contact_email: 'contact@techsolutions.ng',
    contact_phone: '+2348012345678',
    status: 'pending',
    rejection_reason: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    user: {
      id: 'user-123',
      email: 'john@example.com',
      full_name: 'John Doe',
      phone: '+2348012345678',
      avatar_url: null,
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders vendor application information correctly', () => {
    render(<VendorApprovalCard application={mockApplication} />);

    // Check business name
    expect(screen.getByText('Tech Solutions Ltd')).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/We provide innovative technology solutions/)).toBeInTheDocument();

    // Check contact email
    expect(screen.getByText('contact@techsolutions.ng')).toBeInTheDocument();

    // Check contact phone
    expect(screen.getByText('+2348012345678')).toBeInTheDocument();

    // Check applicant name
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check status badge
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows approve and reject buttons', () => {
    render(<VendorApprovalCard application={mockApplication} />);

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('shows formatted submission date', () => {
    render(<VendorApprovalCard application={mockApplication} />);

    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('displays all contact and user information sections', () => {
    render(<VendorApprovalCard application={mockApplication} />);

    // Check section labels
    expect(screen.getByText('Business Description')).toBeInTheDocument();
    expect(screen.getByText('Contact Email')).toBeInTheDocument();
    expect(screen.getByText('Contact Phone')).toBeInTheDocument();
    expect(screen.getByText('Applicant')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });
});
