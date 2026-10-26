# 🚀 Production Setup Quick Start Guide

This is a quick reference guide for setting up FindAm in production. For detailed information, see `DEPLOYMENT.md`.

## ⚡ Quick Deploy (5 Minutes)

### 1. Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2. Set Required Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Minimum Required Variables**:
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Config (REQUIRED)
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Sentry (REQUIRED for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_name

# Analytics (REQUIRED)
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true
```

### 3. Deploy
```bash
vercel --prod
```

Done! Your app is live 🎉

---

## 📋 Full Production Checklist

### Prerequisites
- [ ] Vercel account created
- [ ] Production Supabase project created
- [ ] Sentry account created and project configured
- [ ] Domain name ready (optional)

### Environment Variables Setup
- [ ] Supabase URL and keys
- [ ] Sentry DSN and auth token
- [ ] Vercel Analytics enabled
- [ ] Payment keys (Paystack) if needed
- [ ] Cloudinary credentials if using image uploads
- [ ] Email service (Resend) if sending emails
- [ ] Rate limiting (Upstash Redis) if needed

### Supabase Configuration
- [ ] Database schema deployed
- [ ] Storage buckets created: `avatars`, `listings`
- [ ] RLS policies enabled
- [ ] Production domain added to allowed URLs
- [ ] Database backups configured

### Sentry Configuration
- [ ] Project created
- [ ] Auth token created with permissions: `project:releases`, `org:read`
- [ ] Alert rules configured
- [ ] Notification channels set up (email/Slack)

### Deployment
- [ ] Environment variables set in Vercel
- [ ] Deployed to production
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Manual testing completed
- [ ] Sentry capturing errors
- [ ] Vercel Analytics showing data
- [ ] Performance metrics acceptable (Lighthouse > 90)

---

## 🔑 Where to Get Credentials

### Supabase
1. Go to [app.supabase.com](https://app.supabase.com/)
2. Select your project → Settings → API
3. Copy URL, anon key, and service role key

### Sentry
1. Go to [sentry.io](https://sentry.io/)
2. Create Next.js project
3. Get DSN from Settings → Projects → [Your Project] → Client Keys
4. Create auth token at Settings → Account → API → Auth Tokens
   - Permissions: `project:releases`, `org:read`

### Paystack (Payment)
1. Go to [dashboard.paystack.com](https://dashboard.paystack.com/)
2. Settings → API Keys & Webhooks
3. Use **Live** keys (not test keys!)

### Cloudinary (Images)
1. Go to [console.cloudinary.com](https://console.cloudinary.com/)
2. Dashboard shows all credentials

---

## 🛡️ Security Features (Auto-Enabled)

When you deploy to production, these security features are automatically enabled:

✅ HTTPS enforcement (HSTS)  
✅ Clickjacking protection (X-Frame-Options)  
✅ XSS protection (Content-Security-Policy)  
✅ MIME sniffing protection  
✅ Source maps disabled  
✅ Console logs removed  
✅ Secure headers on all routes  

No additional configuration needed!

---

## 📊 Monitoring (Auto-Configured)

After deployment, monitor your app at:

- **Errors**: [sentry.io](https://sentry.io/) → Your Project
- **Traffic**: Vercel Dashboard → Your Project → Analytics
- **Database**: [app.supabase.com](https://app.supabase.com/) → Your Project → Reports

---

## 🐛 Troubleshooting

### Build Fails
**Issue**: TypeScript errors  
**Fix**: TypeScript errors are ignored during build. Fix locally and redeploy.

### App Not Loading
**Issue**: Environment variables  
**Fix**: Verify all required variables are set in Vercel dashboard. Redeploy after adding variables.

### Images Not Loading
**Issue**: CORS or domain configuration  
**Fix**: Check `next.config.ts` includes your image domains in `remotePatterns`.

### Sentry Not Working
**Issue**: Incorrect DSN or token  
**Fix**: 
1. Verify `NEXT_PUBLIC_SENTRY_DSN` matches your Sentry project
2. Regenerate auth token with correct permissions
3. Redeploy

### Payment Not Working
**Issue**: Using test keys in production  
**Fix**: Use **live** Paystack keys in production environment

---

## 🆘 Emergency Rollback

If something goes wrong:

### Option 1: Via Vercel Dashboard
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Option 2: Via Git
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys
```

---

## 📚 Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Environment Variables**: See `.env.example`
- **README**: See `README.md`
- **Production Config**: See `.kiro/specs/marketplace-functionality-enhancement/PRODUCTION_CONFIG.md`

---

## 💡 Pro Tips

1. **Always test locally first**
   ```bash
   npm run build
   npm run start
   ```

2. **Use Preview Deployments**
   - Create PR → Vercel auto-deploys preview
   - Test before merging to main

3. **Monitor Sentry for First 24 Hours**
   - Check for unexpected errors
   - Configure alerts for critical issues

4. **Set Up Status Page**
   - Monitor uptime
   - Alert users during incidents

5. **Enable Database Backups**
   - Supabase → Database → Backups
   - Keep daily backups for 7 days

---

## ✅ Success Criteria

Your production deployment is successful when:

- ✅ App loads at production URL without errors
- ✅ Sentry capturing errors (test with intentional error)
- ✅ Vercel Analytics showing traffic
- ✅ All core features working:
  - User registration/login
  - Listing creation
  - Image uploads
  - Search functionality
  - Payment processing (if applicable)
- ✅ Performance score > 90 (Lighthouse)
- ✅ Mobile responsive design working
- ✅ Security headers present

---

**Need Help?**

See detailed documentation:
- `DEPLOYMENT.md` - Complete deployment guide
- `README.md` - General documentation
- `.env.example` - All environment variables

Or check the official documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Sentry Docs](https://docs.sentry.io)
- [Next.js Docs](https://nextjs.org/docs)
