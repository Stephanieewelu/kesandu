# Render Deployment Guide

## Overview
Kesandu Guru is deployed to Render as a static Expo web application. This guide covers the production deployment setup and required environment variables.

## Required Environment Variables

Configure these variables in your Render project settings:

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
- **Type:** Single Page Application (Expo Web Export)
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Start Command:** `npm start`
- **Node Version:** 18+ (recommended 20)
- **Runtime:** Node

### Build Process
1. Install dependencies: `npm install`
2. Export Expo web bundle: `npx expo export --platform web`
3. Output generated to `dist/` directory
4. Start server: `serve dist -s -p $PORT`

## Deployment Steps

### Initial Setup
1. Push code to your GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create a new **Web Service**
4. Connect your GitHub repository
5. Render will auto-detect the configuration from `render.yaml`
6. Configure environment variables:
   - `EXPO_PUBLIC_GEMINI_API_KEY`
   - `EXPO_PUBLIC_API_URL`
7. Deploy

### Configuration Files
- **render.yaml:** Build command, start command, environment variables
- **.renderignore:** Files to exclude from the build (if needed)

### Important Notes
- The `serve` package with `-s` flag enables Single Page Application (SPA) routing
- All non-file requests fall back to `index.html` for client-side routing
- Environment variables starting with `EXPO_PUBLIC_` are embedded at build time
- Build artifacts are cached for faster subsequent deployments

## Troubleshooting

### 404 Errors
- **Cause:** Missing build output or incorrect routing configuration
- **Solution:** Ensure `npm run build` is executed. The `-s` flag in the start command enables SPA routing.

### Build Fails with Missing Environment Variables
- Ensure all `EXPO_PUBLIC_*` variables are set in Render project settings
- Restart deployment after adding new variables
- Note: These variables must be set BEFORE the build starts

### Images Not Loading
- Check that static assets are in the `/assets/` directory
- Verify files are included in the build output

### API Connection Issues
- Verify `EXPO_PUBLIC_API_URL` is correct
- Ensure backend API is accessible from Render's servers
- Check CORS settings on backend

### Port Configuration
- Render sets the `PORT` environment variable automatically
- The start command uses `$PORT` to listen on the correct port

## Production Checklist

- [ ] `render.yaml` is in the repository root
- [ ] All environment variables configured in Render dashboard
- [ ] First deployment completed successfully
- [ ] Production URL is accessible
- [ ] Static assets loading properly
- [ ] API connections working
- [ ] Tested core features on production

## Redeploying

To redeploy your application:
1. Make changes to your code
2. Push to your main branch (or connected branch)
3. Render automatically triggers a new deployment
4. Monitor deployment progress in Render dashboard

To manually trigger a deployment:
1. Go to Render dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

## Support
For deployment issues, check:
- [Render Documentation](https://render.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/build-reference/web/)
- Project GitHub issues
