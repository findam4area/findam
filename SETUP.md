# FindAm - Project Setup Guide

## Overview

FindAm is a premium, youth-centered multipurpose marketplace platform for Nigeria built with Next.js 15+, TypeScript, Supabase, and modern web technologies.

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Cloudinary account
- Typesense instance (local or cloud)
- Paystack account (for payments)
- Twilio account (for SMS OTP)
- Mapbox account (for maps)
- Resend account (for emails)

## Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `NEXT_PUBLIC_TYPESENSE_HOST` - Your Typesense host (e.g., localhost)
- `NEXT_PUBLIC_TYPESENSE_PORT` - Your Typesense port (default: 8108)
- `NEXT_PUBLIC_TYPESENSE_PROTOCOL` - Your Typesense protocol (http or https)
- `TYPESENSE_API_KEY` - Your Typesense API key
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Your Paystack public key
- `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- `TWILIO_ACCOUNT_SID` - Your Twilio account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio auth token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Your Mapbox access token
- `RESEND_API_KEY` - Your Resend API key

3. **Set up Supabase:**

Follow the instructions in `SUPABASE_SETUP.md` to:

- Create database tables
- Set up Row Level Security (RLS) policies
- Configure Storage buckets
- Seed initial data

4. **Configure Typesense:**

If running locally with Docker:

```bash
# Run Typesense with Docker
docker run -d -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:27.1 \
  --data-dir /data \
  --api-key=xyz123 \
  --enable-cors
```

Then configure the collection:

```bash
npm run setup:typesense
```

For detailed setup instructions, see `ENV_SETUP_GUIDE.md`.

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

### Frontend

- **Framework:** Next.js 15+ (App Router, React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Animation:** Framer Motion
- **State:** Zustand + TanStack React Query
- **Forms:** react-hook-form + Zod
- **Icons:** lucide-react
- **Theme:** next-themes

### Backend

- **Database:** Supabase (PostgreSQL + PostGIS)
- **Auth:** Supabase Auth (Email/Phone OTP/Google OAuth)
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime
- **Search:** Typesense
- **CDN:** Cloudinary

### Services

- **Payments:** Paystack
- **SMS:** Twilio
- **Email:** Resend + React Email
- **Maps:** Mapbox + react-map-gl + react-leaflet
- **Monitoring:** Sentry (optional)

### Nigerian Localization

- **Currency:** numeral.js (₦ formatting)
- **Phone:** libphonenumber-js (+234 validation)
- **Locations:** nigeria-states-lgas (States/LGAs/Wards)

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── listings/          # Listing components
│   ├── feed/              # Feed components
│   ├── chat/              # Messaging components
│   └── shared/            # Shared components
├── lib/                   # Utilities and configurations
│   ├── supabase/          # Supabase client
│   ├── cloudinary/        # Cloudinary config
│   ├── typesense/         # Typesense client
│   ├── twilio/            # Twilio SMS
│   ├── mapbox/            # Mapbox config
│   ├── utils/             # Utility functions
│   └── providers/         # React providers
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── public/                # Static assets
```

## Key Features

1. **Authentication:** Email/Phone OTP/Google OAuth
2. **Listings:** Create, edit, delete listings with media
3. **Discovery Feed:** Infinite scroll with boosted listings
4. **Search:** Typo-tolerant search with Typesense
5. **Messaging:** Real-time chat with Supabase Realtime
6. **Payments:** Boost listings and premium subscriptions
7. **Stories:** 24-hour disappearing video stories
8. **Safety:** Trust scores, verification badges, scam detection
9. **Mobile-First:** PWA with offline support
10. **Nigerian Localization:** ₦ formatting, +234 phones, States/LGAs

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

## Testing

The project uses Vitest and fast-check for property-based testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

The project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

## Design System

### Colors

- **Primary:** #00C853 (Naira Green)
- **Secondary:** #15A3C7 (Cyan Blue)
- **Accent:** #FF9900 (Market Orange)

### Fonts

- **Display:** Syne
- **Body:** DM Sans
- **Prices:** JetBrains Mono

### Effects

- Glassmorphism with backdrop blur
- Neon accents and glows
- 3D tilt effects on hover
- Smooth animations with Framer Motion

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.
