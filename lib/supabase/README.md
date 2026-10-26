# Supabase SSR Configuration for Next.js 16

This directory contains the Supabase client configurations for FindAm, properly set up for Next.js 16.2.6 with Server-Side Rendering (SSR) support.

## Files

### `server.ts`
Server-side Supabase client for use in:
- Server Components
- Server Actions
- API Routes

**Features:**
- Environment variable validation
- User-friendly error messages
- Admin client with service role access
- Proper cookie handling for Next.js 16
- Implements Requirements 15.1, 15.8, 15.9

**Usage:**
```typescript
// In a Server Component
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('listings').select('*');
  return <div>{/* render data */}</div>;
}

// In a Server Action
'use server'
import { createClient } from '@/lib/supabase/server';

export async function getListings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('listings').select('*');
  if (error) {
    return { error: 'Failed to load listings' };
  }
  return { data };
}
```

### `client.ts`
Client-side Supabase client for use in:
- Client Components ('use client')
- Browser-side operations

**Usage:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.from('listings').select('*').then(({ data }) => setData(data));
  }, []);
  
  return <div>{/* render data */}</div>;
}
```

### `middleware.ts`
Middleware Supabase client for auth state refresh.

**Features:**
- Automatically refreshes auth tokens on every request
- Used in Next.js middleware

**Usage:**
```typescript
// In middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

## Environment Variables

Required environment variables (configured in `.env.local`):

```env
# Public variables (available in browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only variables (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Environment Variable Setup

1. **Development**: Copy `.env.example` to `.env.local` and fill in your Supabase credentials
2. **Production**: Set environment variables in your hosting platform (Vercel, etc.)

## Security Features

### Row Level Security (RLS)
All database queries respect Supabase Row Level Security policies:
- Users can only see approved listings or their own listings
- Admins can see all listings
- Public users can only see approved content

### Cookie Security
- Uses HTTP-only cookies for session management
- Cookies are automatically refreshed on every request via middleware
- Secure cookie handling for Next.js 16 App Router

### Error Handling
- Validates all environment variables on startup
- Provides user-friendly error messages
- Logs detailed errors for debugging

## Admin Operations

For operations that need to bypass RLS (e.g., admin approval workflows), use the admin client:

```typescript
'use server'
import { createAdminClient } from '@/lib/supabase/server';

export async function approveListingAction(listingId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('listings')
    .update({ status: 'approved' })
    .eq('id', listingId);
    
  if (error) {
    return { error: 'Failed to approve listing' };
  }
  return { success: true };
}
```

**Warning:** Admin client bypasses all RLS policies. Use with caution and only for legitimate admin operations.

## Type Safety

The clients use TypeScript types generated from your Supabase schema:

```typescript
import type { Database } from './database.types';

// Clients are typed with your database schema
const supabase = createClient(); // TypeScript knows your tables and columns
```

## Next.js 16 Compatibility

These clients are specifically configured for Next.js 16.2.6:

- ✅ App Router support
- ✅ Server Components (async/await pattern)
- ✅ Server Actions ('use server')
- ✅ Middleware integration
- ✅ Streaming SSR
- ✅ Proper cookie handling with `await cookies()`

## Testing

Tests are available in `__tests__/supabase-clients.test.ts`:

```bash
npm test lib/supabase/__tests__/supabase-clients.test.ts
```

## Requirements Implemented

This configuration implements the following requirements:

- **Requirement 15.1**: Establish Supabase Backend connection using environment variables with validation
- **Requirement 15.8**: Compatible with Next.js 16 Server Components and Supabase SSR package
- **Requirement 15.9**: Implement proper connection pooling and query optimization for performance

## Task Completion: 1.2

This implementation completes Task 1.2 from the marketplace functionality enhancement spec:

### Subtasks Completed:
- ✅ 1.2.1 Install Supabase dependencies (@supabase/ssr@0.8.0, @supabase/supabase-js@2.94.0)
- ✅ 1.2.2 Create lib/supabase/server.ts for server components
- ✅ 1.2.3 Create lib/supabase/client.ts for client components
- ✅ 1.2.4 Set up .env.local with Supabase credentials

### Additional Files:
- ✅ lib/supabase/middleware.ts for auth state management
- ✅ lib/supabase/helpers.ts with type aliases and utility functions
- ✅ lib/supabase/database.types.ts with generated TypeScript types
- ✅ Tests in lib/supabase/__tests__/supabase-clients.test.ts

## Troubleshooting

### "Missing environment variable" error
- Check that `.env.local` exists and contains all required variables
- Restart your development server after changing environment variables

### "Invalid URL format" error
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is a valid URL (starts with https://)
- Check for typos in your Supabase project URL

### Authentication not persisting
- Ensure middleware is properly configured in `middleware.ts`
- Check that cookies are not being blocked by browser settings

### TypeScript errors
- Run `npm run build` to check for type errors
- Regenerate database types if schema changes: `npx supabase gen types typescript`

## References

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [FindAm Requirements](../../.kiro/specs/marketplace-functionality-enhancement/requirements.md)
- [FindAm Design](../../.kiro/specs/marketplace-functionality-enhancement/design.md)
