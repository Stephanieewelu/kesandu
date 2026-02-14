# Vercel Production Deployment Guide

## Overview
Kesandu Guru is deployed to Vercel as a static Expo web application. This guide covers the production deployment setup and required environment variables.

## Required Environment Variables

Configure these variables in your Vercel project settings:

### `EXPO_PUBLIC_GEMINI_API_KEY`
- **Description:** Google Gemini API key for AI-powered content generation and interactive features
- **Type:** String (secret)
- **Required:** Yes
- **Where to get:** [Google Cloud Console](https://console.cloud.google.com/)

### `EXPO_PUBLIC_API_URL`
- **Description:** Base URL for the backend API
- **Type:** String
- **Required:** Yes
- **Example:** `https://api.kesandu.com`
- **Default (development):** `http://localhost:3000`

## Build Configuration

### Framework
- **Type:** Static Site (Expo Web Export)
- **Build Command:** `npm run export`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`
- **Node Version:** 18+ (recommended 20)

### Build Process
1. Install dependencies: `npm ci`
2. Export Expo web bundle: `npx expo export --clear`
3. Output generated to `dist/` directory with the following structure:
   - `index.html` - Entry point
   - `_expo/static/js/web/` - Web bundles
   - `favicon.ico` - Site favicon

## Deployment Steps

### Initial Setup
1. Connect your GitHub repository to Vercel
2. Create a new project
3. Vercel will auto-detect the configuration from `vercel.json`
4. Configure environment variables in project settings:
   - `EXPO_PUBLIC_GEMINI_API_KEY`
   - `EXPO_PUBLIC_API_URL`

### Configuration Files
- **vercel.json:** Build command, output directory, environment variables, and caching headers
- **.vercelignore:** Files to exclude from the build

### Caching Strategy
- HTML entry point (`index.html`): 1 hour cache (dynamic)
- Build artifacts in `/_expo/static/js/web/`: 1 year cache (immutable - versioned filenames)
- Static assets in `/assets/`: 1 year cache (immutable)
- Fallback HTML for client-side routing: 1 hour cache

## After Deployment

### Verification
1. Check that the production URL is accessible
2. Verify environment variables are loaded correctly
3. Test core features:
   - Video lessons loading
   - Interactive challenges
   - AI responses (Gemini API)
   - Achievement system

### Monitoring
- Monitor Vercel dashboard for build failures
- Check real-time analytics in Vercel
- Review error logs in project dashboard

## Rollback
To rollback to a previous deployment:
1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Click on the previous successful deployment
4. Click "Promote to Production"

## Troubleshooting

### Build Fails with Missing Environment Variables
- Ensure all `EXPO_PUBLIC_*` variables are set in Vercel project settings
- Restart deployment after adding new variables

### Images Not Loading
- Check that static assets are in the `/assets/` directory
- Verify `.vercelignore` doesn't exclude necessary files

### API Connection Issues
- Verify `EXPO_PUBLIC_API_URL` is correct
- Ensure backend API is accessible from Vercel region
- Check CORS settings on backend

## Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] First deployment completed successfully
- [ ] Production URL is accessible
- [ ] Cache headers configured correctly
- [ ] Static assets loading properly
- [ ] API connections working
- [ ] Error logging configured
- [ ] Analytics enabled (if applicable)

## Support
For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/build-reference/web/)
- Project GitHub issues
