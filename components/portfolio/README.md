# Portfolio Components

This directory contains components for managing service provider portfolios and job seeker profiles.

## Components

### PortfolioSection

Main component that combines all portfolio features. Displays portfolio items, CV upload, and skills for service providers and job seekers.

**Props:**

- `user: User` - The user whose portfolio to display
- `isOwner?: boolean` - Whether the current user is viewing their own portfolio (enables editing)

**Usage:**

```tsx
import { PortfolioSection } from "@/components/portfolio";

<PortfolioSection user={user} isOwner={true} />;
```

### PortfolioGrid

Displays portfolio items in a responsive grid with hover effects and animations.

**Props:**

- `items: PortfolioItem[]` - Array of portfolio items to display
- `onItemClick?: (item: PortfolioItem) => void` - Callback when an item is clicked
- `editable?: boolean` - Enable delete buttons for editing
- `onDelete?: (id: string) => void` - Callback when delete is clicked
- `onReorder?: (items: PortfolioItem[]) => void` - Callback for reordering items

### PortfolioUploadModal

Modal for uploading new portfolio items (images or videos).

**Props:**

- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Callback to close the modal
- `onUpload: (data: { title: string; description: string; file: File }) => Promise<void>` - Callback to handle upload

### PortfolioLightbox

Full-screen lightbox for viewing portfolio items with navigation.

**Props:**

- `items: PortfolioItem[]` - Array of portfolio items
- `currentIndex: number` - Index of the currently displayed item
- `isOpen: boolean` - Whether the lightbox is open
- `onClose: () => void` - Callback to close the lightbox
- `onNavigate: (index: number) => void` - Callback to navigate between items

### CVUpload

Component for uploading and managing CV/Resume files.

**Props:**

- `currentCvUrl?: string` - URL of the currently uploaded CV
- `onUpload: (file: File) => Promise<void>` - Callback to handle CV upload
- `onDelete?: () => Promise<void>` - Callback to delete the CV

### SkillsList

Component for displaying and editing user skills.

**Props:**

- `skills: string[]` - Array of skill names
- `editable?: boolean` - Enable editing mode
- `onUpdate?: (skills: string[]) => Promise<void>` - Callback to save updated skills

## API Routes

### Portfolio Items

- `GET /api/portfolio?user_id=xxx` - Get portfolio items for a user
- `POST /api/portfolio` - Create a new portfolio item
- `PUT /api/portfolio/[id]` - Update a portfolio item
- `DELETE /api/portfolio/[id]` - Delete a portfolio item
- `POST /api/portfolio/upload` - Upload portfolio media
- `POST /api/portfolio/reorder` - Reorder portfolio items

### CV Management

- `POST /api/portfolio/cv` - Upload CV
- `DELETE /api/portfolio/cv` - Delete CV

### Skills Management

- `PUT /api/portfolio/skills` - Update user skills

## Features

- **Portfolio Grid**: Responsive grid layout with hover effects
- **Media Upload**: Support for images (JPEG, PNG, WebP) and videos (MP4)
- **CV Upload**: PDF and Word document support
- **Skills Management**: Add/remove skills with validation (max 20 skills)
- **Lightbox Viewer**: Full-screen viewing with keyboard navigation
- **Drag-to-Reorder**: Reorder portfolio items (future enhancement)
- **Animations**: Smooth transitions using Framer Motion

## File Size Limits

- Portfolio media: 10MB
- CV files: 5MB

## Supported File Types

### Portfolio Media

- Images: JPEG, PNG, WebP
- Videos: MP4

### CV Files

- PDF
- Word (.doc, .docx)
