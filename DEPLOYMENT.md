# Deployment Guide for Illumine Bible App

This guide covers the production deployment setup for the Illumine Bible App, including security configurations, monitoring, and best practices.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Supabase project (production)
- Domain name and SSL certificate
- Analytics account (Google Analytics, optional)
- Error tracking service (Sentry, optional)

## Environment Setup

### 1. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Bible API Configuration
VITE_BIBLE_API_KEY=your_production_bible_api_key
VITE_BIBLE_API_BASE_URL=https://api.scripture.api.bible

# App Configuration
VITE_APP_NAME=Illumine Bible App
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Analytics and Monitoring (Optional)
VITE_ANALYTICS_ID=your_analytics_id
VITE_SENTRY_DSN=your_sentry_dsn

# Security Headers
VITE_CSP_REPORT_URI=https://your-domain.com/csp-report

# Performance Monitoring
VITE_PERFORMANCE_MONITORING=true
VITE_ERROR_REPORTING=true
```

### 2. Supabase Production Setup

#### Database Migration

```bash
# Run production security migration
supabase db push --db-url "postgresql://[user]:[password]@[host]:[port]/[database]"
```

#### Row Level Security (RLS)

Ensure all tables have RLS enabled:

- ✅ profiles
- ✅ bible_versions
- ✅ bookmarks
- ✅ notes
- ✅ highlights
- ✅ verse_of_the_day
- ✅ audit_log

#### Authentication Settings

1. Configure allowed redirect URLs
2. Enable email confirmations
3. Set up Google OAuth (optional)
4. Configure JWT expiry (recommended: 1 hour)

## Deployment Options

### Option 1: Netlify Deployment

1. **Connect Repository**

   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Deploy
   netlify deploy --prod
   ```

2. **Configuration**

   - Build command: `npm run build:production`
   - Publish directory: `dist`
   - Environment variables: Set in Netlify dashboard

3. **Custom Domain**
   - Add custom domain in Netlify dashboard
   - Configure DNS records
   - SSL certificate is automatically provisioned

### Option 2: Vercel Deployment

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel --prod
   ```

2. **Configuration**
   - Framework preset: Vite
   - Build command: `npm run build:production`
   - Output directory: `dist`
   - Environment variables: Set in Vercel dashboard

### Option 3: GitHub Actions + Custom Server

1. **Setup GitHub Secrets**

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BIBLE_API_KEY`
   - `VITE_ANALYTICS_ID`
   - `VITE_SENTRY_DSN`

2. **Deploy with GitHub Actions**
   The workflow in `.github/workflows/deploy.yml` will:
   - Run tests
   - Build the application
   - Deploy to your hosting platform

## Security Configuration

### 1. Content Security Policy (CSP)

The app includes a strict CSP header:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://api.scripture.api.bible;
worker-src 'self' blob:;
```

### 2. Security Headers

All deployments include:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 3. HTTPS Enforcement

- All traffic is redirected to HTTPS
- HSTS header is set with 1-year max-age
- Secure cookies are enforced

## Performance Optimization

### 1. Build Optimization

The production build includes:

- Code splitting by routes and features
- Tree shaking for unused code
- Minification and compression
- Asset optimization
- Service worker caching

### 2. Caching Strategy

- **Static Assets**: 1 year cache with immutable flag
- **HTML**: No cache, always revalidate
- **Service Worker**: No cache, must revalidate
- **API Responses**: Network-first with 1-day fallback

### 3. Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze
```

## Monitoring and Analytics

### 1. Performance Monitoring

The app includes built-in performance monitoring:

- Page load times
- Component render times
- Memory usage tracking
- Error rate monitoring

### 2. Health Checks

Automated health checks for:

- Supabase connectivity
- IndexedDB functionality
- Service Worker status
- Bible API availability

### 3. Error Tracking

Integration with Sentry for:

- JavaScript errors
- Unhandled promise rejections
- Performance issues
- User session replay (optional)

### 4. Analytics

Google Analytics integration tracks:

- Page views and user sessions
- Bible reading activity
- Search queries (anonymized)
- Feature usage patterns
- PWA installation rates

## Post-Deployment Checklist

### Functionality Tests

- [ ] User registration and login
- [ ] Bible text loading and navigation
- [ ] Offline functionality
- [ ] PWA installation
- [ ] Bookmarks and notes sync
- [ ] Search functionality
- [ ] Theme switching
- [ ] Responsive design on all devices

### Performance Tests

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 1MB gzipped

### Security Tests

- [ ] CSP headers working
- [ ] HTTPS redirect working
- [ ] RLS policies enforced
- [ ] No sensitive data in client
- [ ] Authentication flow secure

### Monitoring Setup

- [ ] Analytics tracking working
- [ ] Error reporting configured
- [ ] Health checks passing
- [ ] Performance metrics collecting

## Maintenance

### Regular Tasks

1. **Weekly**

   - Review error reports
   - Check performance metrics
   - Monitor user feedback

2. **Monthly**

   - Update dependencies
   - Review security audit
   - Analyze usage patterns

3. **Quarterly**
   - Performance optimization review
   - Security assessment
   - Feature usage analysis

### Backup Strategy

- Database: Automated daily backups via Supabase
- Code: Version controlled in Git
- User data: Exportable via app settings

### Rollback Plan

1. **Immediate Issues**

   ```bash
   # Rollback to previous deployment
   netlify rollback  # or vercel rollback
   ```

2. **Database Issues**
   ```bash
   # Restore from backup
   supabase db reset --db-url "your-db-url"
   ```

## Support and Troubleshooting

### Common Issues

1. **Build Failures**

   - Check Node.js version compatibility
   - Verify environment variables
   - Clear node_modules and reinstall

2. **Authentication Issues**

   - Verify Supabase configuration
   - Check redirect URLs
   - Validate JWT settings

3. **Performance Issues**
   - Review bundle size
   - Check service worker caching
   - Monitor memory usage

### Getting Help

- Check application logs in hosting platform
- Review Supabase logs for database issues
- Use browser dev tools for client-side debugging
- Monitor error tracking service for patterns

## Security Considerations

### Data Protection

- All user data is encrypted in transit and at rest
- Row Level Security prevents unauthorized access
- Personal data is minimized and anonymized where possible

### Privacy Compliance

- Clear privacy policy included
- User consent for analytics
- Data export and deletion capabilities
- GDPR compliance measures

### Regular Security Updates

- Dependencies are regularly updated
- Security patches are applied promptly
- Vulnerability scanning is automated
