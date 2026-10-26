# FindAm Production Deployment Guide

This guide covers the complete process of deploying FindAm to production with proper configuration, security, and monitoring.

## Prerequisites

Before deploying, ensure you have:

- ✅ Vercel account (recommended hosting platform)
- ✅ Production Supabase project with database schema deployed
- ✅ Sentry account for error monitoring
- ✅ All third-party service accounts (Paystack, Cloudinary, etc.)
- ✅ Custom domain (optional but recommended)

## Quick Start

1. **Deploy to Vercel** (recommended):
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure environment variables** in Vercel dashboard

3. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Environment Variables Configuration

### Critical Variables (REQUIRED)

These variables **must** be set for the application to function:

#### Supabase (Database & Authentication)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Where to find:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your production project
3. Navigate to Settings → API
4. Copy the URL and keys

⚠️ **Important:** Use production Supabase project, not development!

#### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

#### Error Monitoring (Sentry)
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_name
```

**Setup Instructions:**
1. Create account at [sentry.io](https://sentry.io/)
2. Create a new Next.js project
3. Copy the DSN from Settings → Projects → [Your Project] → Client Keys (DSN)
4. Create auth token at Settings → Account → API → Auth Tokens
   - Scopes needed: `project:releases`, `org:read`
5. Note your org slug and project name

#### Analytics
```bash
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true
```

This is automatically enabled on Vercel. Set to `false` to disable.

### Payment Integration (REQUIRED for transactions)

#### Paystack
```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
```

**Where to find:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to Settings → API Keys & Webhooks
3. Copy the **Live** keys (not test keys!)

⚠️ **Important:** Use live keys for production!

### Media Storage (REQUIRED for image uploads)

#### Cloudinary
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Where to find:**
1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Dashboard shows all credentials
3. Copy Cloud Name, API Key, and API Secret

### Optional Services

#### Email (Resend)
```bash
RESEND_API_KEY=re_xxx
```

Required for: Password resets, notifications

#### Rate Limiting (Upstash Redis)
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

Required for: API rate limiting in production

#### Maps (Mapbox)
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
```

Required for: Location-based features

#### Search (Typesense)
```bash
NEXT_PUBLIC_TYPESENSE_HOST=xxx.typesense.net
NEXT_PUBLIC_TYPESENSE_PORT=443
NEXT_PUBLIC_TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your_api_key
```

Required for: Advanced search functionality

## Vercel Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Project (First Time Only)

```bash
vercel link
```

Follow the prompts to:
- Select your account/team
- Create new project or link existing
- Link to your local directory

### 4. Configure Environment Variables

Two options:

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to your project on [vercel.com](https://vercel.com/)
2. Navigate to Settings → Environment Variables
3. Add all required variables (see list above)
4. Select environments: Production, Preview, Development
5. Click "Save"

**Option B: Via CLI**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... repeat for all variables
```

### 5. Deploy to Production

```bash
vercel --prod
```

This will:
- Build your application
- Upload to Vercel
- Assign your domain
- Go live! 🚀

### 6. Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

## Supabase Production Setup

### 1. Database Schema

Ensure your production database has all tables and policies:

```bash
# Connect to production Supabase project
npx supabase link --project-ref your-project-ref

# Push database schema
npx supabase db push
```

### 2. Storage Buckets

Create required storage buckets:

1. Go to Supabase Dashboard → Storage
2. Create buckets:
   - `avatars` (public)
   - `listings` (public)

### 3. Row Level Security (RLS)

Verify RLS policies are enabled:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

### 4. URL Configuration

Add your production domain to allowed URLs:

1. Supabase Dashboard → Authentication → URL Configuration
2. Add to "Site URL": `https://your-domain.com`
3. Add to "Redirect URLs": 
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/**`

## Security Configuration

### Security Headers

Security headers are automatically configured in `next.config.ts`:

- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Frame-Options` (clickjacking protection)
- ✅ `X-Content-Type-Options` (MIME sniffing protection)
- ✅ `Content-Security-Policy` (XSS protection)
- ✅ `X-XSS-Protection`
- ✅ `Referrer-Policy`
- ✅ `Permissions-Policy`

No additional configuration needed!

### Content Security Policy (CSP)

The CSP is configured to allow:
- Self-hosted assets
- Supabase API calls
- Paystack payment integration
- Cloudinary images

If you add new third-party services, update CSP in `next.config.ts`.

### Production Optimizations

Automatically enabled in production:

- ✅ Console statements removed
- ✅ Source maps disabled (secure)
- ✅ Compression enabled
- ✅ Image optimization (WebP/AVIF)
- ✅ Code splitting and tree shaking
- ✅ React production mode

## Monitoring Setup

### Sentry Error Monitoring

After deployment, verify Sentry is working:

1. Go to [sentry.io](https://sentry.io/)
2. Open your project
3. Navigate to Issues
4. Check for any errors during deployment

**Configure Alerts:**
1. Alerts → New Alert Rule
2. Set conditions for critical errors
3. Add notification channels (email, Slack, etc.)

### Vercel Analytics

Automatically enabled. View metrics at:
1. Vercel Dashboard → Your Project → Analytics
2. Monitor:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### Supabase Monitoring

Monitor database performance:
1. Supabase Dashboard → Reports
2. Check:
   - Database health
   - API usage
   - Storage usage
   - Active connections

## Testing Production Deployment

### 1. Smoke Tests

Run automated smoke tests against production:

```bash
# Update .env with production URL
NEXT_PUBLIC_APP_URL=https://your-domain.com npm run test:smoke:env
```

### 2. Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Create listing works
- [ ] Image upload works
- [ ] Search functionality works
- [ ] Payment integration works (test mode first!)
- [ ] Mobile responsive design
- [ ] PWA install prompt appears
- [ ] Error tracking (trigger test error)

### 3. Performance Testing

Check Core Web Vitals:

```bash
npm run lighthouse
```

Target metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## Troubleshooting

### Build Fails

**TypeScript errors:**
- TypeScript errors are ignored during build (`typescript.ignoreBuildErrors: true`)
- Fix locally and redeploy for better code quality

**Environment variables:**
- Ensure all required variables are set in Vercel dashboard
- Variables starting with `NEXT_PUBLIC_` are exposed to the client
- Server-only variables should NOT have the `NEXT_PUBLIC_` prefix

### Runtime Errors

**"Failed to fetch" errors:**
- Check Supabase URL and keys are correct
- Verify Supabase project is not paused
- Check RLS policies allow the operation

**Images not loading:**
- Verify `remotePatterns` in `next.config.ts` includes image domains
- Check Supabase storage bucket permissions
- Verify Cloudinary configuration

**CSP violations:**
- Check browser console for CSP errors
- Update CSP directives in `next.config.ts`
- Add domains to allowlist

### Sentry Not Capturing Errors

**Common issues:**
- `NEXT_PUBLIC_SENTRY_DSN` not set or incorrect
- `SENTRY_AUTH_TOKEN` doesn't have correct permissions
- Source maps not uploading (check build logs)

**Fix:**
1. Verify DSN in Sentry dashboard matches environment variable
2. Regenerate auth token with `project:releases` and `org:read` scopes
3. Redeploy

## Rollback Procedure

If something goes wrong:

### Option 1: Revert to Previous Deployment

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"

### Option 2: Roll Back Code

```bash
git revert HEAD
git push origin main
# Vercel auto-deploys from main branch
```

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase production database deployed
- [ ] Storage buckets created
- [ ] RLS policies enabled
- [ ] Custom domain configured (if applicable)
- [ ] Sentry error monitoring active
- [ ] Alerts configured in Sentry
- [ ] Smoke tests passed
- [ ] Manual testing completed
- [ ] Performance metrics acceptable
- [ ] Team notified of deployment

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For pull requests

To disable auto-deployment:
1. Vercel Dashboard → Settings → Git
2. Disable "Production Branch Auto Deploy"

## Support and Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

## Emergency Contacts

Add your team's emergency contact information here:

- **Technical Lead**: [email]
- **DevOps**: [email]
- **On-Call**: [phone/slack]
