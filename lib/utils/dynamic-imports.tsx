/**
 * Dynamic imports for code splitting
 * Heavy components are lazy-loaded to reduce initial bundle size
 */

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading component for dynamic imports
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Feed components
export const DynamicFeedContainer = dynamic(
  () =>
    import("@/components/feed/feed-container").then((mod) => ({
      default: mod.FeedContainer,
    })),
  {
    loading: LoadingSpinner,
    ssr: true,
  },
);

export const DynamicTrendingCarousel = dynamic(
  () =>
    import("@/components/feed/trending-carousel").then((mod) => ({
      default: mod.TrendingCarousel,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Listing components
export const DynamicListingCreationWizard = dynamic(
  () =>
    import("@/components/listing/listing-creation-wizard").then((mod) => ({
      default: mod.ListingCreationWizard,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const DynamicListingDetailModal = dynamic(
  () =>
    import("@/components/listing/listing-detail-modal").then((mod) => ({
      default: mod.ListingDetailModal,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Messaging components
export const DynamicChatWindow = dynamic(
  () =>
    import("@/components/messaging/chat-window").then((mod) => ({
      default: mod.ChatWindow,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const DynamicConversationList = dynamic(
  () =>
    import("@/components/messaging/conversation-list").then((mod) => ({
      default: mod.ConversationList,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Story components
export const DynamicStoriesCarousel = dynamic(
  () =>
    import("@/components/stories").then((mod) => ({
      default: mod.StoriesCarousel,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const DynamicStoryViewer = dynamic(
  () =>
    import("@/components/stories/story-viewer").then((mod) => ({
      default: mod.StoryViewer,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Admin components
export const DynamicAdminDashboard = dynamic(
  () =>
    import("@/components/admin/admin-dashboard").then((mod) => ({
      default: mod.AdminDashboard,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Profile components
export const DynamicProfileEditor = dynamic(
  () =>
    import("@/components/profile/profile-editor").then((mod) => ({
      default: mod.ProfileEditor,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const DynamicPortfolioSection = dynamic(
  () =>
    import("@/components/portfolio/portfolio-section").then((mod) => ({
      default: mod.PortfolioSection,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Search components
export const DynamicFilterPanel = dynamic(
  () =>
    import("@/components/search/filter-panel").then((mod) => ({
      default: mod.FilterPanel,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Payment components
export const DynamicBoostPaymentModal = dynamic(
  () =>
    import("@/components/payments/boost-payment-modal").then((mod) => ({
      default: mod.BoostPaymentModal,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Review components
export const DynamicReviewForm = dynamic(
  () =>
    import("@/components/reviews/review-form").then((mod) => ({
      default: mod.ReviewForm,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);
