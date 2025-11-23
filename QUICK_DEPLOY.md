# 🚀 AuroraAI - Quick Deploy Guide

## Step 1: Git Setup
```bash
git init
git add .
git commit -m "feat: AuroraAI with modern black & white UI"
```

## Step 2: Create GitHub Repository
1. Go to github.com → New repository
2. Name: `aurora-ai`
3. Copy repository URL

## Step 3: Push to GitHub
```bash
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Follow prompts → Add environment variables in Vercel dashboard

## Step 5: Environment Variables
Add these in your deployment platform:
- `OPENROUTER_API_KEY`
- `GOOGLE_SEARCH_API_KEY` 
- `GOOGLE_SEARCH_ENGINE_ID`
- `FREEPIK_API_KEY`

## Step 6: Test Deployment
Visit your deployed URL and test all pages:
- ✅ Mixed Hub - Smart AI model selection
- ✅ Deep Thinkers - Advanced reasoning
- ✅ Visual Creators - Image generation
- ✅ Dashboard - Professional stats

## 🎯 Done! Your AuroraAI is now live! 🌟
