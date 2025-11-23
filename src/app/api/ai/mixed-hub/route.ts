import { NextRequest, NextResponse } from 'next/server';
import { OptiBrain } from '@/lib/ai/orchestrator';
import { getUserTier } from '@/lib/tiers/tiers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, modelTypes, options } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    // Get user tier from headers or session
    const userId = request.headers.get('x-user-id') || undefined;
    const tier = getUserTier(userId);

    // Use orchestration for mixed hub
    const result = await OptiBrain.runMixedOrchestration(input, {
      modelTypes: modelTypes || ['text', 'realtime'],
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
        candidatesCount: result.allCandidates.length,
        modelTypes: result.metadata.modelTypes,
      },
    });

  } catch (error) {
    console.error('Mixed Hub API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
