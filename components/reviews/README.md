# Reviews Components

This directory contains all components related to the review and rating system for FindAm.

## Components

### ReviewForm

A form component for submitting or editing reviews with star rating and optional comment.

**Props:**

- `reviewedUserId`: ID of the user being reviewed
- `listingId`: Optional listing ID associated with the review
- `onSubmit`: Callback function when form is submitted
- `onCancel`: Optional callback for cancel action
- `initialRating`: Initial rating value (for editing)
- `initialComment`: Initial comment text (for editing)
- `isEditing`: Whether the form is in edit mode

**Features:**

- Interactive star rating (1-5 stars)
- Hover effects on stars
- Optional comment field (max 1000 characters)
- Character counter
- Validation and error handling
- Loading states

### ReviewList

Displays a list of reviews with user information and ratings.

**Props:**

- `reviews`: Array of review objects
- `currentUserId`: ID of the current user (for showing edit/delete options)
- `onEdit`: Callback when edit button is clicked
- `onDelete`: Callback when delete button is clicked
- `className`: Optional CSS classes

**Features:**

- User avatar and username display
- Star rating visualization
- Relative timestamps (e.g., "2 days ago")
- Edit/delete menu for own reviews
- Empty state when no reviews
- Smooth animations

### AverageRating

Displays the average rating with stars and review count.

**Props:**

- `average`: Average rating value (0-5)
- `count`: Total number of reviews
- `showCount`: Whether to show review count (default: true)
- `size`: Size variant - "sm", "md", or "lg"
- `className`: Optional CSS classes

**Features:**

- Numeric rating display
- Visual star representation
- Half-star support
- Review count display
- Responsive sizing

### ReviewEditModal

A modal dialog for editing existing reviews.

**Props:**

- `review`: The review object to edit
- `isOpen`: Whether the modal is open
- `onClose`: Callback to close the modal
- `onUpdate`: Callback when review is updated

**Features:**

- Full-screen overlay
- Glassmorphism design
- Escape key to close
- Click outside to close
- Embedded ReviewForm

### ReviewsSection

A comprehensive component that combines all review functionality.

**Props:**

- `userId`: ID of the user whose reviews to display
- `currentUserId`: ID of the current logged-in user
- `initialReviews`: Initial reviews data (optional)
- `initialAverage`: Initial average rating (optional)
- `initialCount`: Initial review count (optional)
- `canReview`: Whether the current user can write a review
- `className`: Optional CSS classes

**Features:**

- Average rating display
- "Write a Review" button
- Collapsible review form
- Reviews list with edit/delete
- Automatic data fetching
- Toast notifications
- Loading states

## Usage Example

```tsx
import { ReviewsSection } from "@/components/reviews";

export default function ProfilePage({ userId, currentUserId }) {
  return (
    <div>
      <ReviewsSection
        userId={userId}
        currentUserId={currentUserId}
        canReview={true}
      />
    </div>
  );
}
```

## API Integration

The components integrate with the following API endpoints:

- `GET /api/reviews?user_id={userId}` - Fetch reviews for a user
- `POST /api/reviews` - Create a new review
- `PUT /api/reviews/{id}` - Update a review
- `DELETE /api/reviews/{id}` - Delete a review

## Styling

All components use:

- Tailwind CSS for styling
- Framer Motion for animations
- Glassmorphism effects
- Neon accent colors (naija-green, neon-cyan)
- Dark theme optimized

## Requirements Validated

These components validate the following requirements:

- **16.1**: Review submission with rating and comment
- **16.2**: Review display with average rating calculation
- **16.3**: Transaction authorization before review
- **16.4**: Trust Score update on review submission
- **16.5**: Review editing functionality
