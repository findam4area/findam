/**
 * Unit Tests for Skeleton Loading Components
 * 
 * Tests all skeleton components to ensure they render correctly
 * and provide appropriate loading states for their corresponding content.
 * 
 * Requirements: 13.7, 13.14
 * Task: 10.8 - Add loading states to all async operations
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Skeleton,
  ListingCardSkeleton,
  ProfileHeaderSkeleton,
  MessageListSkeleton,
  SearchResultsSkeleton,
  StoryRingSkeleton,
  FeedSkeleton,
  CategoryGridSkeleton,
  NotificationListSkeleton,
  ListingDetailSkeleton,
  CategoryCardSkeleton,
  AdminDashboardSkeleton,
} from '../skeleton';

describe('Skeleton', () => {
  it('renders base Skeleton component', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-gray-800/50');
  });

  it('applies custom className to Skeleton', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-20');
  });

  it('passes through additional props to Skeleton', () => {
    const { container } = render(<Skeleton data-testid="custom-skeleton" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveAttribute('data-testid', 'custom-skeleton');
  });
});

describe('ListingCardSkeleton', () => {
  it('renders listing card skeleton structure', () => {
    const { container } = render(<ListingCardSkeleton />);
    
    // Should have glass-card wrapper
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
    
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(4); // Image, title, price, location, user info
  });

  it('has correct aspect ratio for image skeleton', () => {
    const { container } = render(<ListingCardSkeleton />);
    const imageSkeletons = container.querySelectorAll('.aspect-\\[4\\/3\\]');
    
    expect(imageSkeletons.length).toBeGreaterThan(0);
  });
});

describe('ProfileHeaderSkeleton', () => {
  it('renders profile header skeleton structure', () => {
    const { container } = render(<ProfileHeaderSkeleton />);
    
    // Should have glass-card wrapper
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
    
    // Should have avatar skeleton (rounded-full)
    const avatarSkeletons = container.querySelectorAll('.rounded-full');
    expect(avatarSkeletons.length).toBeGreaterThan(0);
  });

  it('includes multiple content skeletons', () => {
    const { container } = render(<ProfileHeaderSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Avatar + username + bio lines + stats
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });
});

describe('MessageListSkeleton', () => {
  it('renders 5 message skeletons', () => {
    const { container } = render(<MessageListSkeleton />);
    const messages = container.querySelectorAll('.rounded-full');
    
    // Each message has a rounded avatar
    expect(messages.length).toBe(5);
  });
});

describe('SearchResultsSkeleton', () => {
  it('renders 6 listing card skeletons in grid', () => {
    const { container } = render(<SearchResultsSkeleton />);
    
    // Should have grid layout
    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass('grid');
    
    // Should have 6 listing cards
    const cards = container.querySelectorAll('.glass-card');
    expect(cards.length).toBe(6);
  });

  it('has responsive grid classes', () => {
    const { container } = render(<SearchResultsSkeleton />);
    const grid = container.firstChild as HTMLElement;
    
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});

describe('StoryRingSkeleton', () => {
  it('renders 8 story ring skeletons', () => {
    const { container } = render(<StoryRingSkeleton />);
    const stories = container.querySelectorAll('.rounded-full');
    
    // Each story has a rounded avatar
    expect(stories.length).toBe(8);
  });

  it('has horizontal scrolling layout', () => {
    const { container } = render(<StoryRingSkeleton />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).toHaveClass('overflow-x-auto');
  });
});

describe('FeedSkeleton', () => {
  it('renders 3 listing card skeletons', () => {
    const { container } = render(<FeedSkeleton />);
    const cards = container.querySelectorAll('.glass-card');
    
    expect(cards.length).toBe(3);
  });

  it('has vertical spacing', () => {
    const { container } = render(<FeedSkeleton />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).toHaveClass('space-y-6');
  });
});

describe('CategoryGridSkeleton', () => {
  it('renders 8 category card skeletons', () => {
    const { container } = render(<CategoryGridSkeleton />);
    const cards = container.querySelectorAll('.glass-card');
    
    expect(cards.length).toBe(8);
  });

  it('has responsive grid layout', () => {
    const { container } = render(<CategoryGridSkeleton />);
    const grid = container.firstChild as HTMLElement;
    
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-3');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });
});

describe('NotificationListSkeleton', () => {
  it('renders 5 notification skeletons', () => {
    const { container } = render(<NotificationListSkeleton />);
    const notifications = container.querySelectorAll('.glass-card');
    
    expect(notifications.length).toBe(5);
  });

  it('includes avatar skeletons', () => {
    const { container } = render(<NotificationListSkeleton />);
    const avatars = container.querySelectorAll('.rounded-full');
    
    expect(avatars.length).toBe(5);
  });
});

describe('ListingDetailSkeleton', () => {
  it('renders all listing detail sections', () => {
    const { container } = render(<ListingDetailSkeleton />);
    
    // Image gallery
    const aspectVideo = container.querySelector('.aspect-video');
    expect(aspectVideo).toBeInTheDocument();
    
    // Glass cards for details and seller info
    const cards = container.querySelectorAll('.glass-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('includes seller avatar skeleton', () => {
    const { container } = render(<ListingDetailSkeleton />);
    const avatars = container.querySelectorAll('.rounded-full');
    
    expect(avatars.length).toBeGreaterThan(0);
  });
});

describe('CategoryCardSkeleton', () => {
  it('renders category card structure', () => {
    const { container } = render(<CategoryCardSkeleton />);
    
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
    
    // Should have centered content
    const skeletons = container.querySelectorAll('.mx-auto');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('AdminDashboardSkeleton', () => {
  it('renders metrics cards', () => {
    const { container } = render(<AdminDashboardSkeleton />);
    
    // First grid should have 4 metric cards
    const grids = container.querySelectorAll('.grid');
    expect(grids.length).toBeGreaterThan(0);
    
    const cards = container.querySelectorAll('.glass-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('includes chart skeleton', () => {
    const { container } = render(<AdminDashboardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Should have a large skeleton for chart (h-64)
    const chartSkeleton = Array.from(skeletons).find(el => 
      el.classList.contains('h-64')
    );
    expect(chartSkeleton).toBeInTheDocument();
  });

  it('includes table skeleton', () => {
    const { container } = render(<AdminDashboardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Should have multiple row skeletons (h-12)
    const rowSkeletons = Array.from(skeletons).filter(el => 
      el.classList.contains('h-12')
    );
    expect(rowSkeletons.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Accessibility', () => {
  it('all skeletons are keyboard accessible', () => {
    const components = [
      <ListingCardSkeleton key="1" />,
      <ProfileHeaderSkeleton key="2" />,
      <CategoryCardSkeleton key="3" />,
    ];
    
    components.forEach((component) => {
      const { container } = render(component);
      const interactiveElements = container.querySelectorAll('button, a, input');
      
      // Skeleton components should not have interactive elements
      expect(interactiveElements.length).toBe(0);
    });
  });

  it('skeletons have appropriate ARIA attributes if needed', () => {
    const { container } = render(<ListingCardSkeleton />);
    
    // Skeletons don't need ARIA labels as they're visual placeholders
    // But we verify they don't interfere with accessibility
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).not.toHaveAttribute('role', 'alert');
  });
});
