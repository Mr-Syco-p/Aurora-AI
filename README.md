<<<<<<< HEAD
# AuroraAI - Advanced AI Hub

A sophisticated multi-model AI hub with intelligent orchestration, featuring custom model names, smart response selection, and a futuristic neon-themed UI.

![AuroraAI](https://img.shields.io/badge/AuroraAI-Advanced_AI_Hub-39FF14?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

## ✨ Features

### 🧠 Deep Thinkers (Text & Reasoning)
- **NeuroMind** - Advanced reasoning and analysis
- **LogicFlow** - Structured, step-by-step responses  
- **Cognitia** - Summaries and content rewriting

### 🎨 Visual Creators (Image & Video)
- **Visionary** - High-resolution photorealistic images
- **ArtForge** - Stylized artistic creations
- **PixelDream** - Experimental and animated content

### 📡 Realtime Assist (Live Information)
- **LiveFetch** - Google Search and web sources
- **InfoPulse** - YouTube videos and transcripts

### ⚡ Mixed Hub (Orchestration)
- **OptiBrain** - Intelligent model selection and response orchestration
- Automatic scoring and evaluation of multiple AI responses
- Best-answer selection with confidence scoring
- Alternative response viewing and analysis

### 🎯 Advanced Features
- **Smart Orchestration** - Automatically selects best AI model for each request
- **Tier System** - Free and paid tiers with different model access
- **Rate Limiting** - Intelligent quota management per tier
- **Real-time Logging** - Comprehensive activity monitoring and analytics
- **Futuristic UI** - Neon green, black, and red theme with smooth animations
- **Error Handling** - Graceful error recovery and user-friendly messages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd aurora-ai
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure API keys** in `.env.local`:
```env
# Required for basic functionality
AURORA_OPENROUTER_API_KEY=sk-or-v1-your-key-here
AURORA_MISTRAL_API_KEY=your-key-here
AURORA_GEMINI_API_KEY=your-key-here

# For image generation
AURORA_HF_API_KEY=hf-your-key-here
AURORA_DEEPINFRA_API_KEY=your-key-here

# For realtime search
AURORA_GOOGLE_API_KEY=your-key-here
AURORA_GOOGLE_SEARCH_ENGINE_ID=your-id-here
AURORA_YOUTUBE_API_KEY=your-key-here
```

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🏗️ Architecture

### Backend Structure
```
src/lib/
├── ai/
│   ├── types.ts          # Type definitions
│   ├── aiServices.ts     # Model integrations
│   ├── orchestrator.ts   # OptiBrain orchestration logic
│   └── rateLimiter.ts    # Rate limiting system
├── tiers/
│   └── tiers.ts          # Tier configurations
└── logging/
    └── logger.ts         # Logging system
```

### Frontend Structure
```
src/app/
├── page.tsx              # Dashboard
├── deep-thinkers/        # Text AI interface
├── visual-creators/      # Image AI interface
├── realtime-assist/     # Realtime search interface
├── mixed-hub/           # Orchestration interface
├── logs/                # System logs viewer
└── api/ai/              # API routes
```

### Components
```
src/components/
├── NavBar.tsx           # Navigation
├── PromptInput.tsx      # User input
├── OutputPanel.tsx      # Response display
├── LoadingIndicator.tsx  # Loading states
├── ErrorBanner.tsx      # Error handling
├── TierBadge.tsx        # Tier indicators
└── LogsViewer.tsx       # Logs interface
```

## 🔧 Configuration

### API Providers Supported
- **OpenRouter** - Claude, GPT, and other models
- **Mistral AI** - Advanced reasoning models
- **Google Gemini** - Google's latest AI models
- **Hugging Face** - Open source models
- **DeepInfra** - Fast inference endpoints
- **Google Search** - Web search capabilities
- **YouTube API** - Video content access

### Model Customization
Each model can be configured via environment variables:
```env
AURORA_NEUROMIND_MODEL_ID=anthropic/claude-3.5-sonnet
AURORA_VISIONARY_MODEL_ID=stabilityai/stable-diffusion-xl-base-1.0
```

### Tier Configuration
- **Free Tier**: Limited models, lower rate limits
- **Paid Tier**: Full access, higher limits, priority processing

## 🎨 UI/UX Features

### Design System
- **Colors**: Neon green (#39FF14), black (#02040A), red accents (#FF2052)
- **Typography**: Geist font family for modern readability
- **Animations**: Smooth transitions with Framer Motion
- **Responsive**: Mobile-first design approach

### Interactive Elements
- Hover effects with neon glow
- Loading animations with progress indicators
- Error states with retry functionality
- Real-time response streaming
- Collapsible alternative responses

## 📊 Analytics & Monitoring

### System Logs
- Request tracking with timestamps
- Model performance metrics
- Success rates and error analysis
- Token usage monitoring
- User activity patterns

### Performance Metrics
- Response latency tracking
- Model scoring and selection
- Rate limiting statistics
- Tier usage analytics

## 🔒 Security Features

### API Key Management
- Environment variable configuration
- No hardcoded credentials
- Secure key validation
- Error message sanitization

### Rate Limiting
- Per-user request quotas
- Token usage limits
- Tier-based restrictions
- Automatic quota recovery

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
Set all required API keys in your hosting platform's environment settings.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Reference

### Text Generation
```typescript
POST /api/ai/deep-thinkers
{
  "prompt": "Your question here",
  "modelId": "neuromind", // optional
  "options": {
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

### Image Generation
```typescript
POST /api/ai/visual-creators
{
  "prompt": "A beautiful sunset",
  "modelId": "visionary", // optional
  "style": "realistic",
  "dimensions": {
    "width": 512,
    "height": 512
  }
}
```

### Mixed Orchestration
```typescript
POST /api/ai/mixed-hub
{
  "input": "Your request",
  "modelTypes": ["text", "realtime"],
  "options": {
    "threshold": 0.6,
    "maxIterations": 2
  }
}
```

## 🐛 Troubleshooting

### Common Issues
1. **API Key Errors**: Verify all environment variables are set correctly
2. **Rate Limits**: Check tier quotas and upgrade if needed
3. **Network Issues**: Ensure proper internet connectivity
4. **Model Unavailable**: Some models may require specific provider accounts

### Debug Mode
Enable detailed logging:
```env
AURORA_LOG_LEVEL=debug
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AI providers for their powerful APIs
- Next.js team for the excellent framework
- Framer Motion for smooth animations
- Tailwind CSS for the utility-first styling

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

---

**Built with ❤️ and AuroraAI's intelligent orchestration**
=======
# Aurora-AI
Aurora AI — Real-time multi-agent AI assistant with deep analysis, mission control, search, and image generation.
>>>>>>> 2855cf27e0a6335f09c4bf31fcd622c14c2407d6
