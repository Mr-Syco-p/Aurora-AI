import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      userId: searchParams.get('userId') || undefined,
      tier: searchParams.get('tier') as 'free' | 'paid' || undefined,
      requestType: searchParams.get('requestType') as 'text' | 'image' | 'realtime' | 'mixed' || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const logs = logger.getLogs(options);
    const stats = logger.getLogStats();

    return NextResponse.json({
      success: true,
      logs,
      stats,
      pagination: {
        total: logs.length,
        limit: options.limit || 50,
        offset: options.offset || 0,
      },
    });

  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    logger.clearLogs();
    
    return NextResponse.json({
      success: true,
      message: 'Logs cleared successfully',
    });

  } catch (error) {
    console.error('Clear logs error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
