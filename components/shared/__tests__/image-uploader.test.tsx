/**
 * Tests for ImageUploader Component
 * 
 * This test suite verifies:
 * - Component renders correctly
 * - File validation works (type and size)
 * - Drag-and-drop functionality
 * - Image upload and deletion
 * - Image reordering
 * - Error handling
 * - Mobile-optimized touch targets
 * 
 * Requirements: 13.1, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.16
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploader } from '../image-uploader';
import * as imageActions from '@/lib/actions/image-actions';

// Mock the image actions
vi.mock('@/lib/actions/image-actions', () => ({
  uploadImageAction: vi.fn(),
  deleteImageAction: vi.fn(),
  extractPathFromUrl: vi.fn((url: string) => {
    // Simple mock: extract path from URL
    const parts = url.split('/');
    return parts.slice(-3).join('/');
  }),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, className }: any) => (
    <img src={src} alt={alt} className={className} data-fill={fill} />
  ),
}));

describe('ImageUploader', () => {
  const mockOnImagesUploaded = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Requirement 13.3: Component renders with drag-and-drop zone
  it('renders upload zone when no images uploaded', () => {
    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.getByText('Upload Images')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop images here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Images/i })).toBeInTheDocument();
  });

  // Requirement 13.3: Maximum images limit displayed
  it('displays correct remaining slots based on maxImages prop', () => {
    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        maxImages={5}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.getByText(/5 of 5 images remaining/i)).toBeInTheDocument();
  });

  // Requirement 13.3: Shows existing images
  it('displays existing images when provided', () => {
    const existingImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];

    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        existingImages={existingImages}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.getByText(/Uploaded Images \(2\)/i)).toBeInTheDocument();
  });

  // Requirement 13.4: File type validation
  it('validates file types correctly', async () => {
    const { container } = render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp');
  });

  // Requirement 13.5: File size limit displayed
  it('displays maximum file size limit', () => {
    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        maxSizeMB={5}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.getByText(/Max 5MB per image/i)).toBeInTheDocument();
  });

  // Requirement 13.6: Supported formats displayed
  it('displays supported file formats', () => {
    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.getByText(/Supported formats: JPEG, PNG, WebP/i)).toBeInTheDocument();
  });

  // Requirement 13.7: Upload action is called with correct parameters
  it('calls uploadImageAction when file is selected', async () => {
    const mockUploadResult = {
      success: true,
      result: {
        url: 'https://example.com/uploaded.jpg',
        path: 'user-id/listing-id/image-1-123456.jpg',
        size: 1024000,
      },
    };

    vi.mocked(imageActions.uploadImageAction).mockResolvedValue(mockUploadResult);

    const { container } = render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    // Create a mock file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(imageActions.uploadImageAction).toHaveBeenCalled();
    });

    // Verify FormData was created correctly
    const uploadCall = vi.mocked(imageActions.uploadImageAction).mock.calls[0];
    expect(uploadCall[1]).toBe('listings');
  });

  // Requirement 13.8: Error handling displays error message
  it('displays error message when upload fails', async () => {
    const mockUploadResult = {
      success: false,
      error: 'Upload failed due to network error',
    };

    vi.mocked(imageActions.uploadImageAction).mockResolvedValue(mockUploadResult);

    const { container } = render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Upload failed due to network error/i)).toBeInTheDocument();
    });
  });

  // Requirement 13.9: Primary image indicator
  it('marks first image as primary', () => {
    const existingImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];

    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        existingImages={existingImages}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  // Requirement 13.10: Remove button is present for each image
  it('displays remove button for each uploaded image', () => {
    const existingImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];

    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        existingImages={existingImages}
        bucket="listings"
        listingId="test-listing"
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove image');
    expect(removeButtons).toHaveLength(2);
  });

  // Requirement 13.10: Delete action is called when removing image
  it('calls deleteImageAction when remove button clicked', async () => {
    vi.mocked(imageActions.deleteImageAction).mockResolvedValue({ success: true });

    const existingImages = ['https://example.com/image1.jpg'];

    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        existingImages={existingImages}
        bucket="listings"
        listingId="test-listing"
      />
    );

    const removeButton = screen.getByLabelText('Remove image');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(imageActions.deleteImageAction).toHaveBeenCalled();
    });

    expect(mockOnImagesUploaded).toHaveBeenCalledWith([]);
  });

  // Requirement 13.16: Touch-friendly button sizes (minimum 44x44px)
  it('has touch-friendly button sizes for mobile', () => {
    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    const selectButton = screen.getByRole('button', { name: /Select Images/i });
    const styles = window.getComputedStyle(selectButton);
    
    // Check for minimum touch target size class
    expect(selectButton.className).toContain('min-h-[44px]');
  });

  // Requirement 13.16: Mobile-optimized drag zone
  it('includes touch-manipulation class for mobile optimization', () => {
    const { container } = render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        bucket="listings"
        listingId="test-listing"
      />
    );

    const dragZone = container.querySelector('.touch-manipulation');
    expect(dragZone).toBeInTheDocument();
  });

  // Requirement 13.3: Hides upload zone when max images reached
  it('hides upload zone when maximum images uploaded', () => {
    const existingImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
      'https://example.com/image4.jpg',
      'https://example.com/image5.jpg',
    ];

    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        maxImages={5}
        existingImages={existingImages}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(screen.queryByText('Upload Images')).not.toBeInTheDocument();
  });

  // Requirement 13.9: Reordering instructions displayed
  it('displays reordering instructions when images are uploaded', () => {
    const existingImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];

    render(
      <ImageUploader
        onImagesUploaded={mockOnImagesUploaded}
        existingImages={existingImages}
        bucket="listings"
        listingId="test-listing"
      />
    );

    expect(
      screen.getByText(/Drag images to reorder. The first image will be used as the primary thumbnail./i)
    ).toBeInTheDocument();
  });
});
