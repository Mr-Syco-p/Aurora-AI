import { Tier, TierConfig, RateLimitConfig } from '../ai/types';

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  free: {
    name: 'free',
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 500,
      tokensPerHour: 10000,
    },
    availableModels: [
      'neuromind',
      'logicflow', 
      'livefetch'
    ],
    maxTokens: 1000,
    priority: 2,
    features: {
      maxImageSize: 512,
      maxConcurrentRequests: 2,
      streaming: false,
      prioritySupport: false,
      analytics: false,
    },
  },
  paid: {
    name: 'paid',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      tokensPerHour: 100000,
    },
    availableModels: [
      'neuromind',
      'logicflow',
      'cognitia',
      'visionary',
      'artforge',
      'pixeldream',
      'livefetch',
      'infopulse'
    ],
    maxTokens: 4000,
    priority: 1,
    features: {
      maxImageSize: 1024,
      maxConcurrentRequests: 10,
      streaming: true,
      prioritySupport: true,
      analytics: true,
    },
  },
};

// Enhanced tier detection with multiple strategies
export function getUserTier(userId?: string, headers?: Record<string, string>): Tier {
  if (!userId) return 'free';
  
  // Strategy 1: Check for explicit tier header
  const tierHeader = headers?.['x-user-tier'] as Tier;
  if (tierHeader && ['free', 'paid'].includes(tierHeader)) {
    return tierHeader;
  }
  
  // Strategy 2: Check for API key patterns (paid users often have special keys)
  const apiKey = headers?.['authorization'] || headers?.['x-api-key'];
  if (apiKey) {
    // Paid users might have keys starting with specific prefixes
    if (apiKey.startsWith('ak-paid-') || apiKey.startsWith('sk-pro-')) {
      return 'paid';
    }
  }
  
  // Strategy 3: Check user ID patterns
  if (userId.startsWith('paid_') || userId.startsWith('premium_')) {
    return 'paid';
  }
  
  // Strategy 4: Environment-based tier for development
  if (process.env.NODE_ENV === 'development' && process.env.AURORA_DEFAULT_PAID === 'true') {
    return 'paid';
  }
  
  // Strategy 5: Database lookup (in production, replace with actual DB call)
  // This would be something like:
  // const user = await db.user.findUnique({ where: { id: userId } });
  // return user?.tier || 'free';
  
  return 'free'; // Default to free tier
}

export function isModelAvailableForTier(modelId: string, tier: Tier): boolean {
  return TIER_CONFIGS[tier].availableModels.includes(modelId);
}

export function getModelsForTier(tier: Tier): string[] {
  return TIER_CONFIGS[tier].availableModels;
}

// New helper functions for enhanced features
export function getTierFeatures(tier: Tier) {
  return TIER_CONFIGS[tier].features;
}

export function canUserAccessFeature(feature: keyof TierConfig['features'], tier: Tier): boolean {
  return !!TIER_CONFIGS[tier].features?.[feature];
}

export function getMaxImageSize(tier: Tier): number {
  return TIER_CONFIGS[tier].features?.maxImageSize || 512;
}

export function getMaxConcurrentRequests(tier: Tier): number {
  return TIER_CONFIGS[tier].features?.maxConcurrentRequests || 1;
}
