import { 
  ModelConfig, 
  TextRequest, 
  TextResponse, 
  ImageRequest, 
  ImageResponse, 
  RealtimeRequest, 
  RealtimeResponse,
  Tier 
} from './types';
import { isModelAvailableForTier } from '@/lib/tiers/tiers';

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Deep Thinkers
  neuromind: {
    id: 'neuromind',
    name: 'NeuroMind',
    type: 'text',
    provider: 'openrouter',
    modelId: process.env.AURORA_NEUROMIND_MODEL_ID || 'anthropic/claude-3.5-sonnet',
    maxTokens: 4000,
    supportedTiers: ['free', 'paid'],
    requiresAuth: true,
    envKey: 'AURORA_OPENROUTER_API_KEY',
  },
  logicflow: {
    id: 'logicflow',
    name: 'LogicFlow',
    type: 'text',
    provider: 'mistral',
    modelId: process.env.AURORA_LOGICFLOW_MODEL_ID || 'mistral-large-latest',
    maxTokens: 4000,
    supportedTiers: ['free', 'paid'],
    requiresAuth: true,
    envKey: 'AURORA_MISTRAL_API_KEY',
  },
  cognitia: {
    id: 'cognitia',
    name: 'Cognitia',
    type: 'text',
    provider: 'mistral',
    modelId: 'mistral-small-latest',
    maxTokens: 4000,
    supportedTiers: ['paid'],
    requiresAuth: true,
    envKey: 'AURORA_MISTRAL_API_KEY',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'text',
    provider: 'deepseek',
    modelId: process.env.AURORA_DEEPSEEK_MODEL_ID || 'deepseek-chat',
    maxTokens: 4000,
    supportedTiers: ['free', 'paid'],
    requiresAuth: true,
    envKey: 'AURORA_DEEPSEEK_API_KEY',
  },
  
  // Visual Creators
  visionary: {
    id: 'visionary',
    name: 'Visionary',
    type: 'image',
    provider: 'huggingface',
    modelId: process.env.AURORA_VISIONARY_MODEL_ID || 'stabilityai/stable-diffusion-2-1-base',
    maxTokens: 1000,
    supportedTiers: ['paid'],
    requiresAuth: true,
    envKey: 'AURORA_HF_API_KEY',
  },
  artforge: {
    id: 'artforge',
    name: 'ArtForge',
    type: 'image',
    provider: 'huggingface',
    modelId: process.env.AURORA_ARTFORGE_MODEL_ID || 'runwayml/stable-diffusion-v1-5',
    maxTokens: 1000,
    supportedTiers: ['paid'],
    requiresAuth: true,
    envKey: 'AURORA_HF_API_KEY',
  },
  pixeldream: {
    id: 'pixeldream',
    name: 'PixelDream',
    type: 'image',
    provider: 'deepinfra',
    modelId: process.env.AURORA_PIXELDREAM_MODEL_ID || 'stabilityai/sdxl-turbo',
    maxTokens: 1000,
    supportedTiers: ['paid'],
    requiresAuth: true,
    envKey: 'AURORA_DEEPINFRA_API_KEY',
  },
  
  // Realtime Assist
  livefetch: {
    id: 'livefetch',
    name: 'LiveFetch',
    type: 'realtime',
    provider: 'google',
    modelId: 'search',
    maxTokens: 500,
    supportedTiers: ['free', 'paid'],
    requiresAuth: true,
    envKey: 'AURORA_GOOGLE_API_KEY',
  },
  infopulse: {
    id: 'infopulse',
    name: 'InfoPulse',
    type: 'realtime',
    provider: 'youtube',
    modelId: 'youtube',
    maxTokens: 500,
    supportedTiers: ['paid'],
    requiresAuth: true,
    envKey: 'AURORA_YOUTUBE_API_KEY',
  },
};

export class TextModelService {
  static async generateText(request: TextRequest, modelId: string): Promise<TextResponse> {
    const config = MODEL_CONFIGS[modelId];
    if (!config || config.type !== 'text') {
      throw new Error(`Invalid text model: ${modelId}`);
    }

    const startTime = Date.now();
    
    try {
      let content: string;
      let tokensUsed: number | undefined;

      switch (config.provider) {
        case 'openrouter':
          ({ content, tokensUsed } = await this.callOpenRouter(request, config));
          break;
        case 'mistral':
          ({ content, tokensUsed } = await this.callMistral(request, config));
          break;
        case 'gemini':
          ({ content, tokensUsed } = await this.callGemini(request, config));
          break;
        case 'groq':
          ({ content, tokensUsed } = await this.callGroq(request, config));
          break;
        case 'deepseek':
          ({ content, tokensUsed } = await this.callDeepSeek(request, config));
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      const latency = Date.now() - startTime;

      return {
        type: 'text',
        modelId,
        modelName: config.name,
        modelType: 'text',
        content,
        timestamp: new Date(),
        latency,
        tokensUsed,
        confidence: this.calculateConfidence(content, tokensUsed),
      };
    } catch (error) {
      const errorMessage = this.handleApiError(error, config.provider);
      return {
        type: 'text',
        modelId,
        modelName: config.name,
        modelType: 'text',
        content: '',
        timestamp: new Date(),
        latency: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  private static handleApiError(error: any, provider: string): string {
    // Handle different types of API errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return `Authentication failed for ${provider}. Please check your API key.`;
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return `Rate limit exceeded for ${provider}. Please try again later.`;
      }
      if (error.message.includes('timeout')) {
        return `Request timeout for ${provider}. The service may be temporarily unavailable.`;
      }
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return `Network error connecting to ${provider}. Please check your internet connection.`;
      }
      return `Error from ${provider}: ${error.message}`;
    }
    return `Unknown error occurred with ${provider} provider`;
  }

  private static async callOpenRouter(request: TextRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.maxTokens || config.maxTokens,
        temperature: request.options?.temperature || 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return { content, tokensUsed };
  }

  private static async callMistral(request: TextRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.maxTokens || config.maxTokens,
        temperature: request.options?.temperature || 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Mistral API error: ${response.statusText}`);
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return { content, tokensUsed };
  }

  private static async callGemini(request: TextRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: request.prompt }] }],
        generationConfig: {
          maxOutputTokens: request.options?.maxTokens || config.maxTokens,
          temperature: request.options?.temperature || 0.7,
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    
    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || '';
    const tokensUsed = data.usageMetadata?.totalTokenCount;

    return { content, tokensUsed };
  }

  private static async callGroq(request: TextRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.maxTokens || config.maxTokens,
        temperature: request.options?.temperature || 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return { content, tokensUsed };
  }

  private static async callDeepSeek(request: TextRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.maxTokens || config.maxTokens,
        temperature: request.options?.temperature || 0.7,
      }),
    });

    if (!response.ok) throw new Error(`DeepSeek API error: ${response.statusText}`);
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return { content, tokensUsed };
  }

  private static calculateConfidence(content: string, tokensUsed?: number): number {
    // Simple heuristic for confidence score
    if (!content) return 0;
    
    let score = 0.5; // Base score
    
    // Length factor
    if (content.length > 100) score += 0.2;
    if (content.length > 500) score += 0.2;
    
    // Token usage factor
    if (tokensUsed && tokensUsed > 50) score += 0.1;
    
    return Math.min(score, 1.0);
  }
}

export class ImageModelService {
  static async generateImage(request: ImageRequest, modelId: string): Promise<ImageResponse> {
    const config = MODEL_CONFIGS[modelId];
    if (!config || config.type !== 'image') {
      throw new Error(`Invalid image model: ${modelId}`);
    }

    const startTime = Date.now();
    
    try {
      let imageUrl: string | undefined;
      let imageBase64: string | undefined;

      switch (config.provider) {
        case 'huggingface':
          ({ imageUrl, imageBase64 } = await this.callHuggingFace(request, config));
          break;
        case 'deepinfra':
          ({ imageUrl, imageBase64 } = await this.callDeepInfra(request, config));
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      const latency = Date.now() - startTime;

      return {
        type: 'image',
        modelId,
        modelName: config.name,
        modelType: 'image',
        content: imageUrl || imageBase64 || '',
        timestamp: new Date(),
        latency,
        imageUrl,
        imageBase64,
        metadata: {
          width: request.dimensions?.width || 512,
          height: request.dimensions?.height || 512,
          format: 'png',
        },
      };
    } catch (error) {
      return {
        type: 'image',
        modelId,
        modelName: config.name,
        modelType: 'image',
        content: '',
        timestamp: new Date(),
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static async callHuggingFace(request: ImageRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch(`https://api-inference.huggingface.co/models/${config.modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: request.prompt,
        parameters: {
          width: request.dimensions?.width || 512,
          height: request.dimensions?.height || 512,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) throw new Error(`HuggingFace API error: ${response.statusText}`);
    
    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64}`;

    return { imageUrl, imageBase64: base64 };
  }

  private static async callDeepInfra(request: ImageRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch(`https://api.deepinfra.com/v1/inference/${config.modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        width: request.dimensions?.width || 512,
        height: request.dimensions?.height || 512,
        num_images: 1,
      }),
    });

    if (!response.ok) throw new Error(`DeepInfra API error: ${response.statusText}`);
    
    const data = await response.json();
    const imageUrl = data.images?.[0];

    return { imageUrl, imageBase64: undefined };
  }
}

export class RealtimeService {
  static async fetchRealtimeInfo(request: RealtimeRequest, modelId: string): Promise<RealtimeResponse> {
    const config = MODEL_CONFIGS[modelId];
    if (!config || config.type !== 'realtime') {
      throw new Error(`Invalid realtime model: ${modelId}`);
    }

    const startTime = Date.now();
    
    try {
      let sources: any[] = [];
      let summary = '';

      switch (config.provider) {
        case 'google':
          ({ sources, summary } = await this.callGoogleSearch(request, config));
          break;
        case 'youtube':
          ({ sources, summary } = await this.callYouTubeSearch(request, config));
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      const latency = Date.now() - startTime;

      return {
        type: 'realtime',
        modelId,
        modelName: config.name,
        modelType: 'realtime',
        content: summary,
        timestamp: new Date(),
        latency,
        sources,
        summary,
      };
    } catch (error) {
      return {
        type: 'realtime',
        modelId,
        modelName: config.name,
        modelType: 'realtime',
        content: '',
        timestamp: new Date(),
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        sources: [],
        summary: '',
      };
    }
  }

  private static async callGoogleSearch(request: RealtimeRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    const searchEngineId = process.env.AURORA_GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);
    if (!searchEngineId) throw new Error('Missing Google Search Engine ID');

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(request.prompt)}&num=${request.maxResults || 10}`, {
      method: 'GET',
    });

    if (!response.ok) throw new Error(`Google Search API error: ${response.statusText}`);
    
    const data = await response.json();
    
    const sources = (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      type: 'web' as const,
    }));

    const summary = sources.length > 0 
      ? `Found ${sources.length} web results. Top result: ${sources[0].title} - ${sources[0].snippet}`
      : 'No results found.';

    return { sources, summary };
  }

  private static async callYouTubeSearch(request: RealtimeRequest, config: ModelConfig) {
    const apiKey = process.env[config.envKey];
    
    if (!apiKey) throw new Error(`Missing API key: ${config.envKey}`);

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(request.prompt)}&type=video&part=snippet&maxResults=${request.maxResults || 10}`, {
      method: 'GET',
    });

    if (!response.ok) throw new Error(`YouTube API error: ${response.statusText}`);
    
    const data = await response.json();
    
    const sources = (data.items || []).map((item: any) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      snippet: item.snippet.description,
      type: 'youtube' as const,
    }));

    const summary = sources.length > 0 
      ? `Found ${sources.length} YouTube videos. Top result: ${sources[0].title}`
      : 'No videos found.';

    return { sources, summary };
  }
}

export const deepThinkers = {
  neuromind: MODEL_CONFIGS.neuromind,
  logicflow: MODEL_CONFIGS.logicflow,
  cognitia: MODEL_CONFIGS.cognitia,
};

export const visualCreators = {
  visionary: MODEL_CONFIGS.visionary,
  artforge: MODEL_CONFIGS.artforge,
  pixeldream: MODEL_CONFIGS.pixeldream,
};

export const realtimeAssist = {
  livefetch: MODEL_CONFIGS.livefetch,
  infopulse: MODEL_CONFIGS.infopulse,
};

export function getAvailableModels(tier: Tier): {
  deepThinkers: Record<string, ModelConfig>;
  visualCreators: Record<string, ModelConfig>;
  realtimeAssist: Record<string, ModelConfig>;
} {
  return {
    deepThinkers: Object.fromEntries(
      Object.entries(deepThinkers).filter(([_, config]) => 
        isModelAvailableForTier(config.id, tier)
      )
    ),
    visualCreators: Object.fromEntries(
      Object.entries(visualCreators).filter(([_, config]) => 
        isModelAvailableForTier(config.id, tier)
      )
    ),
    realtimeAssist: Object.fromEntries(
      Object.entries(realtimeAssist).filter(([_, config]) => 
        isModelAvailableForTier(config.id, tier)
      )
    ),
  };
}
