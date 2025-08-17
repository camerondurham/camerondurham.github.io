# Deployment Instructions

## GitHub Pages Setup

1. **Repository Settings:**
   - Go to repository Settings > Pages
   - Source: "GitHub Actions"
   - Custom domain: `u64.cam`

2. **Domain Configuration:**
   - CNAME file is already included in `public/CNAME`
   - DNS should point to GitHub Pages IPs

3. **Automatic Deployment:**
   - Push to `main` branch triggers deployment
   - Workflow builds Next.js and deploys to GitHub Pages
   - Site available at https://u64.cam

## Local Development

```bash
cd u64-cam-nextjs
npm install
npm run dev
```

## Manual Build

```bash
npm run build
# Output in ./out directory
```

## Migration Status

✅ All phases complete:
- Phase 1: Project setup
- Phase 2: Content migration  
- Phase 3: Layout & styling
- Phase 4: Static assets
- Phase 5: Features (RSS, analytics)
- Phase 6: Deployment setup

The site is ready for production deployment!
