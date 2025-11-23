import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models available on OpenRouter
const FREE_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.2-1b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'microsoft/phi-3-mini-4k-instruct:free',
  'google/gemma-2-2b-it:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2-7b-instruct:free',
  'qwen/qwen-2-1.5b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free'
];

// Rate limiting tracking
const requestCounts = new Map<string, { count: number; lastReset: number; minuteCount: number; minuteReset: number }>();

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'meta-llama/llama-3.2-3b-instruct:free' } = await request.json();

    // Check rate limits
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const clientStats = requestCounts.get(clientId) || { count: 0, lastReset: now, minuteCount: 0, minuteReset: now };

    // Reset daily counter if needed
    if (now - clientStats.lastReset > 24 * 60 * 60 * 1000) {
      clientStats.count = 0;
      clientStats.lastReset = now;
    }

    // Reset minute counter if needed
    if (now - clientStats.minuteReset > 60 * 1000) {
      clientStats.minuteCount = 0;
      clientStats.minuteReset = now;
    }

    // Check rate limits
    if (clientStats.count >= 200) {
      return NextResponse.json(
        { error: 'Daily rate limit exceeded (200 requests/day for free models)' },
        { status: 429 }
      );
    }

    if (clientStats.minuteCount >= 20) {
      return NextResponse.json(
        { error: 'Minute rate limit exceeded (20 requests/minute for free models)' },
        { status: 429 }
      );
    }

    // Update counters
    clientStats.count++;
    clientStats.minuteCount++;
    requestCounts.set(clientId, clientStats);

    // Auto prompt correction for better answers
    const correctedMessages = enhancePromptForBetterAnswers(messages);

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.AURORA_OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    // Make request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aurora-ai.local',
        'X-Title': 'AuroraAI Realtime Assist'
      },
      body: JSON.stringify({
        model: model,
        messages: correctedMessages,
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'text' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `OpenRouter API error: ${errorData.error || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return response with rate limit info
    return NextResponse.json({
      content: data.choices[0]?.message?.content || '',
      model: model,
      usage: data.usage,
      rateLimits: {
        remainingDaily: 200 - clientStats.count,
        remainingMinute: 20 - clientStats.minuteCount,
        resetTime: clientStats.lastReset + 24 * 60 * 60 * 1000
      }
    });

  } catch (error) {
    console.error('OpenRouter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Auto prompt correction for better answers
function enhancePromptForBetterAnswers(messages: any[]) {
  const enhancedMessages = [...messages];
  
  // If it's a search/analysis request, enhance the prompt
  const lastMessage = enhancedMessages[enhancedMessages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
    const userContent = lastMessage.content;
    
    // Check if this is a search/analysis request
    if (isSearchRequest(userContent)) {
      // Enhance the prompt for better analysis
      const enhancedContent = `You are an advanced AI assistant specializing in comprehensive analysis and research. 

Please provide a detailed, well-structured response to the following query: "${userContent}"

Guidelines for your response:
1. Be thorough and comprehensive
2. Provide clear, structured information
3. Include relevant context and background
4. Use proper formatting with headings and bullet points
5. Be accurate and factual
6. Consider multiple perspectives when relevant
7. Provide actionable insights when appropriate

User Query: ${userContent}

Please provide a comprehensive analysis:`;

      enhancedMessages[enhancedMessages.length - 1] = {
        ...lastMessage,
        content: enhancedContent
      };
    }
  }
  
  return enhancedMessages;
}

function isSearchRequest(content: string): boolean {
  const searchKeywords = [
    'what is', 'how to', 'why', 'when', 'where', 'who', 'explain',
    'search', 'find', 'look up', 'research', 'analyze', 'tell me about',
    'describe', 'compare', 'difference between', 'benefits of', 'pros and cons'
  ];
  
  const lowerContent = content.toLowerCase();
  return searchKeywords.some(keyword => lowerContent.includes(keyword));
}

// Get available models
export async function GET() {
  return NextResponse.json({
    models: FREE_MODELS,
    rateLimits: {
      daily: 200,
      minute: 20,
      note: 'Free tier rate limits apply'
    }
  });
}
