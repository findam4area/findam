# FindAm - A Nigerian Business Directory Marketplace

A youth-focused business directory and classified platform for the Nigerian market.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Payment**: Paystack
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Testing**: Vitest, React Testing Library, fast-check (PBT)
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Supabase account** - [Sign up](https://supabase.com)
- **Paystack account** (for payments) - [Sign up](https://paystack.com)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd findam4area
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env.local` and fill in your environment variables:

```bash
cp .env.example .env.local
```

4. **Set up your Supabase project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - Run the database migrations (see `/docs/database-setup.md`)

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

### Required Variables (Core Functionality)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | [Supabase Dashboard](https://app.supabase.com) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | [Supabase Dashboard](https://app.supabase.com) → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | [Supabase Dashboard](https://app.supabase.com) → Settings → API |
| `NEXT_PUBLIC_APP_URL` | Full URL of your application | `http://localhost:3000` (dev) or your production domain |
| `NODE_ENV` | Environment mode | `development`, `production`, or `test` |

### Required for Production

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | [Sentry](https://sentry.io/settings/projects/) |
| `SENTRY_AUTH_TOKEN` | Sentry authentication token (build-time) | [Sentry](https://sentry.io/settings/account/api/auth-tokens/) |
| `SENTRY_ORG` | Your Sentry organization slug | [Sentry](https://sentry.io/settings/) |
| `SENTRY_PROJECT` | Your Sentry project name | [Sentry](https://sentry.io/settings/projects/) |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` | Enable/disable Vercel Analytics | Set to `true` (enabled by default on Vercel) |

### Payment Integration

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key | [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (server-side only) | [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers) |

### Media & Storage

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | [Cloudinary Console](https://console.cloudinary.com/) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | [Cloudinary Console](https://console.cloudinary.com/) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server-side only) | [Cloudinary Console](https://console.cloudinary.com/) |

### Optional Services

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `RESEND_API_KEY` | Resend email service API key | [Resend](https://resend.com/api-keys) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting) | [Upstash Console](https://console.upstash.com/) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | [Upstash Console](https://console.upstash.com/) |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox access token (maps) | [Mapbox](https://account.mapbox.com/access-tokens/) |
| `TYPESENSE_API_KEY` | Typesense search API key | [Typesense Cloud](https://cloud.typesense.org/) |
| `OPENAI_API_KEY` | OpenAI API key (content moderation) | [OpenAI Platform](https://platform.openai.com/api-keys) |

See `.env.example` for a complete list of all available environment variables.

## Deployment

### Deploying to Vercel (Recommended)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Link your project**

```bash
vercel link
```

3. **Configure environment variables**

Add all required environment variables in the Vercel dashboard:
- Go to your project → Settings → Environment Variables
- Add production values for all required variables (see Environment Variables section above)
- **Critical variables for production:**
  - `NEXT_PUBLIC_SUPABASE_URL` (production Supabase URL)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production anon key)
  - `SUPABASE_SERVICE_ROLE_KEY` (production service role key)
  - `NEXT_PUBLIC_SENTRY_DSN` (for error tracking)
  - `SENTRY_AUTH_TOKEN` (for source map uploads)
  - `SENTRY_ORG` and `SENTRY_PROJECT`
  - All payment and third-party service keys

4. **Deploy**

```bash
vercel --prod
```

### Production Configuration Checklist

Before deploying to production, ensure:

- ✅ All required environment variables are set in Vercel dashboard
- ✅ Supabase production database is set up with proper schema
- ✅ Supabase Row Level Security (RLS) policies are enabled
- ✅ Supabase Storage buckets (`avatars`, `listings`) are created with correct policies
- ✅ Sentry project is configured for error monitoring
- ✅ Vercel Analytics is enabled (automatic on Vercel)
- ✅ Security headers are configured (automatic via `next.config.ts`)
- ✅ Production domain is added to Supabase allowed URLs
- ✅ Paystack webhook URLs are configured (if using webhooks)
- ✅ Content Security Policy (CSP) allows your domains

### Security Features (Production)

The following security features are automatically enabled in production:

1. **Security Headers** (configured in `next.config.ts`):
   - `Strict-Transport-Security` (HSTS)
   - `X-Frame-Options` (clickjacking protection)
   - `X-Content-Type-Options` (MIME sniffing protection)
   - `Content-Security-Policy` (XSS protection)
   - `X-XSS-Protection`
   - `Referrer-Policy`
   - `Permissions-Policy`

2. **Build Optimizations**:
   - Console statements removed in production
   - Source maps disabled (secure)
   - Bundle optimization and code splitting
   - Image optimization with WebP/AVIF formats

3. **Error Monitoring**:
   - Sentry captures and reports all errors
   - Source maps uploaded securely for debugging
   - Performance monitoring enabled

4. **Rate Limiting** (if Upstash Redis configured):
   - API endpoints protected against abuse
   - Configurable limits per endpoint

### Environment-Specific Configuration

The application automatically adjusts behavior based on `NODE_ENV`:

**Development** (`NODE_ENV=development`):
- PWA service worker disabled
- Verbose error messages
- Hot module reloading enabled
- CSP allows `unsafe-eval` for development tools

**Production** (`NODE_ENV=production`):
- PWA service worker enabled
- Console logs removed
- Source maps disabled
- Strict CSP without `unsafe-eval`
- Performance optimizations enabled

### Monitoring and Analytics

After deployment, monitor your application:

1. **Sentry Dashboard**: Track errors and performance
   - [https://sentry.io/](https://sentry.io/)

2. **Vercel Analytics**: Monitor web vitals and user traffic
   - Available in your Vercel project dashboard

3. **Supabase Dashboard**: Monitor database performance
   - [https://app.supabase.com/](https://app.supabase.com/)

### Troubleshooting Deployment

**Build fails with TypeScript errors:**
- TypeScript errors are ignored during build (`typescript.ignoreBuildErrors: true`)
- Fix type errors locally before deploying for better code quality

**Environment variables not working:**
- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables

**Images not loading:**
- Check that `remotePatterns` in `next.config.ts` includes your image domains
- Verify Supabase storage bucket permissions

**Sentry not capturing errors:**
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check that `SENTRY_AUTH_TOKEN` has proper permissions for source map uploads

**CSP violations:**
- Check browser console for CSP errors
- Update CSP directives in `next.config.ts` to allow required domains

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── feed/              # Feed-related components
│   ├── listing/           # Listing components
│   ├── messaging/         # Messaging components
│   └── shared/            # Shared components
├── lib/                   # Utility functions and configurations
│   ├── supabase/          # Supabase client setup
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── validations/       # Zod validation schemas
│   └── constants/         # App constants
├── store/                 # Zustand stores
├── public/                # Static assets
└── vitest.config.ts       # Vitest configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode

## Testing

The project uses Vitest for unit testing and fast-check for property-based testing.

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Environment Variables

See `.env.local.example` for required environment variables.

## Features

- 🔐 User authentication (email/password, OAuth)
- 👤 User profiles with Trust Score system
- 📝 Listing creation and management
- 🔍 Advanced search and filtering
- 💬 Real-time messaging
- 📱 Stories feature (24-hour videos)
- 💳 Payment integration (Paystack)
- 🛡️ Safety and anti-fraud features
- 📊 Admin dashboard
- 🔔 Real-time notifications
- 📱 PWA support for offline functionality
- 🎨 Glassmorphism and neon design system

## License

Proprietary - All rights reserved
