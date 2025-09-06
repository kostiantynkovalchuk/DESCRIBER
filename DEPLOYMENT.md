# The Describer - Deployment Guide

An accessibility-focused app that helps vision-impaired users by describing uploaded images using AI and reading descriptions aloud.

## Features
- Image upload via drag & drop or file picker
- AI-powered image descriptions using Anthropic Claude
- Text-to-speech functionality
- Keyboard shortcuts for accessibility (Alt+D, Alt+S, Alt+C, Alt+X)
- Screen reader optimized interface

## Prerequisites
1. Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Cloudflare account

## Local Development

### 1. Set up environment variables
Create a `.env` file in the project root:
```bash
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```

### 2. Install dependencies and run locally
```bash
npm install
npm run dev
```

## Cloudflare Pages Deployment

### Method 1: Drag & Drop (Recommended)
1. Build the project: `npm run build`
2. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
3. Click "Create a project" → "Upload assets"
4. Drag and drop the entire project folder
5. Configure environment variables (see step 3 below)

### Method 2: Git Integration
1. Push code to GitHub/GitLab
2. Connect repository in Cloudflare Pages
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

### 3. Configure Environment Variables
In Cloudflare Pages Dashboard:
1. Go to your project → Settings → Environment variables
2. Add variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key
   - **Environment**: Production (and Preview if needed)
3. Save and redeploy

### 4. Set API Key via Terminal (Alternative)
```bash
# Using Wrangler CLI
npm install -g wrangler
wrangler login
wrangler pages secret put ANTHROPIC_API_KEY
# Enter your API key when prompted
```

## Getting Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

## Accessibility Features

- **Alt+D**: Describe image
- **Alt+S**: Speak description aloud
- **Alt+C**: Copy description
- **Alt+X**: Clear and start over
- Screen reader announcements
- High contrast design
- Keyboard navigation support

## File Structure
```
├── index.html          # Main HTML file
├── index.css           # Styles
├── script.js           # Frontend JavaScript
├── functions/
│   └── api/
│       └── describe.js # Cloudflare Pages API function
├── package.json        # Dependencies
├── _headers            # Security headers
└── wrangler.toml       # Cloudflare configuration
```

## Troubleshooting

**API Key Issues:**
- Ensure ANTHROPIC_API_KEY is set in Cloudflare Pages environment variables
- Check API key is valid and has sufficient credits
- Verify key starts with `sk-ant-`

**CORS Errors:**
- The API function includes proper CORS headers
- If issues persist, check browser developer console

**Image Upload Issues:**
- Ensure image is under 20MB
- Supported formats: JPG, PNG, GIF, WebP
- Try different image formats if one doesn't work

## Support
- Check browser console for detailed error messages
- Ensure JavaScript is enabled
- Test with different image sizes and formats