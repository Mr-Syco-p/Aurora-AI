import { NextRequest, NextResponse } from 'next/server';
import { OptiBrain } from '@/lib/ai/orchestrator';
import { getUserTier } from '@/lib/tiers/tiers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId, style, dimensions, options } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get user tier from headers or session
    const userId = request.headers.get('x-user-id') || undefined;
    const tier = getUserTier(userId);

    // If specific model is requested, use direct service
    if (modelId) {
      const { ImageModelService } = await import('@/lib/ai/aiServices');
      const response = await ImageModelService.generateImage(
        { 
          type: 'image', 
          prompt, 
          userId, 
          tier, 
          style, 
          dimensions,
          options 
        },
        modelId
      );
      
      return NextResponse.json({
        success: true,
        response,
        metadata: {
          modelId,
          tier,
          orchestration: false,
        },
      });
    }

    // Otherwise use orchestration
    const result = await OptiBrain.runImageOrchestration(prompt, {
      tier,
      userId,
      style,
      dimensions,
      ...options,
    });

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        tier,
        orchestration: true,
        candidatesCount: result.allCandidates.length,
      },
    });

  } catch (error) {
    console.error('Visual Creators API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
