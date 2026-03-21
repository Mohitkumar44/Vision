import { NextResponse } from 'next/server';
import { analyzeObjectPermanenceFlow } from '@/ai/flows/analyze-object-permanence';

export async function POST(req: Request) {
  try {
    const { baselineImage, currentFrame, description } = await req.json();

    if (!currentFrame || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the Genkit flow function directly
    const result = await analyzeObjectPermanenceFlow({
      baselineImage,
      currentFrame,
      description,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Analyze Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
