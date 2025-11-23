export type ModelType = 'text' | 'image' | 'realtime';

export type Tier = 'free' | 'paid';

export interface BaseRequest {
  prompt: string;
  userId?: string;
  tier?: Tier;
  options?: {
    maxTokens?: number;
    temperature?: number;
    modelId?: string;
  };
}

export interface TextRequest extends BaseRequest {
  type: 'text';
}

export interface ImageRequest extends BaseRequest {
  type: 'image';
  style?: string;
  dimensions?: { width: number; height: number };
}

export interface RealtimeRequest extends BaseRequest {
  type: 'realtime';
  sources?: ('web' | 'youtube' | 'custom')[];
  maxResults?: number;
}

export interface BaseResponse {
  modelId: string;
  modelName: string;
  modelType: ModelType;
  content: string;
  timestamp: Date;
  latency: number;
  tokensUsed?: number;
  confidence?: number;
  error?: string;
}

export interface TextResponse extends BaseResponse {
  type: 'text';
  content: string;
}

export interface ImageResponse extends BaseResponse {
  type: 'image';
  imageUrl?: string;
  imageBase64?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

export interface RealtimeResponse extends BaseResponse {
  type: 'realtime';
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    type: 'web' | 'youtube' | 'custom';
  }>;
  summary: string;
}

export interface OrchestrationRequest {
  input: string;
  modelTypes: ModelType[];
  tier?: Tier;
  userId?: string;
  options?: {
    maxIterations?: number;
    threshold?: number;
    includeUnusedOutputs?: boolean;
  };
}

export interface CandidateResponse {
  response: BaseResponse;
  score: number;
  completenessScore: number;
  latencyPenalty: number;
  tokenPenalty: number;
  finalScore: number;
}

export interface OrchestrationResult {
  selectedResponse: BaseResponse;
  allCandidates: CandidateResponse[];
  unusedOutputs: BaseResponse[];
  orchestrationTime: number;
  iterations: number;
  metadata: {
    userId?: string;
    tier: Tier;
    modelTypes: ModelType[];
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  type: ModelType;
  provider: 'huggingface' | 'mistral' | 'deepinfra' | 'openrouter' | 'groq' | 'gemini' | 'google' | 'youtube' | 'custom' | 'deepseek';
  endpoint?: string;
  modelId: string;
  maxTokens: number;
  supportedTiers: Tier[];
  requiresAuth: boolean;
  envKey: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  tier: Tier;
  requestType: ModelType | 'mixed';
  input: string;
  selectedModel: string;
  allModels: string[];
  scores: Record<string, number>;
  tokensUsed: number;
  latency: number;
  success: boolean;
  error?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerHour: number;
}

export interface TierFeatures {
  maxImageSize: number;
  maxConcurrentRequests: number;
  streaming: boolean;
  prioritySupport: boolean;
  analytics: boolean;
}

export interface TierConfig {
  name: Tier;
  rateLimit: RateLimitConfig;
  availableModels: string[];
  maxTokens: number;
  priority: number;
  features?: TierFeatures;
}
