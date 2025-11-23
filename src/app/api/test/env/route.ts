import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    environment: {
      openrouter: !!process.env.AURORA_OPENROUTER_API_KEY,
      mistral: !!process.env.AURORA_MISTRAL_API_KEY,
      gemini: !!process.env.AURORA_GEMINI_API_KEY,
      hf: !!process.env.AURORA_HF_API_KEY,
      deepinfra: !!process.env.AURORA_DEEPINFRA_API_KEY,
      groq: !!process.env.AURORA_GROQ_API_KEY,
      youtube: !!process.env.AURORA_YOUTUBE_API_KEY,
      google: !!process.env.AURORA_GOOGLE_API_KEY,
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
