import { NextRequest, NextResponse } from 'next/server';
import { OptiBrain } from '../../../../lib/ai/orchestrator';
import { getUserTier } from '../../../../lib/tiers/tiers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId, options } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Debug: Check environment variables
    console.log('Environment check:', {
      openrouter: !!process.env.AURORA_OPENROUTER_API_KEY,
      mistral: !!process.env.AURORA_MISTRAL_API_KEY,
      gemini: !!process.env.AURORA_GEMINI_API_KEY,
      deepseek: !!process.env.AURORA_DEEPSEEK_API_KEY,
      hf: !!process.env.AURORA_HF_API_KEY,
      deepinfra: !!process.env.AURORA_DEEPINFRA_API_KEY,
    });

    // Get user tier from headers or session
    const userId = request.headers.get('x-user-id') || undefined;
    const headers = Object.fromEntries(request.headers.entries());
    const tier = getUserTier(userId, headers);

    // Get client IP from various headers (Next.js doesn't provide ip directly)
    const getClientIP = () => {
      return request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-client-ip') ||
             'unknown';
    };

    // Import rate limiter dynamically
    const { rateLimiter } = await import('../../../../lib/ai/rateLimiter');

    // Check rate limits
    const rateLimitResult = rateLimiter.checkAndConsumeQuota({
      userId,
      ip: getClientIP(),
      tier,
      tokensUsed: options?.maxTokens || 1000,
      endpoint: 'deep-thinkers',
      modelType: 'text',
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { 
          error: rateLimitResult.reason,
          retryAfter: rateLimitResult.retryAfter,
          remaining: rateLimitResult.remaining,
          violationCount: rateLimitResult.violationCount,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.requests?.toString() || '0',
          }
        }
      );
    }

    // If specific model is requested, use direct service
    if (modelId) {
      const { TextModelService } = await import('../../../../lib/ai/aiServices');
      const response = await TextModelService.generateText(
        { type: 'text', prompt, userId, tier, options },
        modelId
      );
      
      return NextResponse.json({
        success: true,
        response,
        metadata: {
          modelId,
          tier,
          orchestration: false,
          rateLimit: rateLimitResult.remaining,
        },
      });
    }

    // Otherwise use orchestration
    const result = await OptiBrain.runTextOrchestration(prompt, {
      tier,
      userId,
      ...options,
    });

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        tier,
        orchestration: true,
        rateLimit: rateLimitResult.remaining,
      },
    });
  } catch (error) {
    console.error('Deep Thinkers API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for rate limit status
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined;
    const headers = Object.fromEntries(request.headers.entries());
    const tier = getUserTier(userId, headers);
    
    // Import rate limiter dynamically
    const { rateLimiter } = await import('../../../../lib/ai/rateLimiter');
    const status = rateLimiter.getStatus(userId || 'anonymous', tier);
    
    return NextResponse.json({
      success: true,
      status,
      tier,
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
