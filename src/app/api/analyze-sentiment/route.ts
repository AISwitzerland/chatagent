import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Prüfe API Key nur beim Server-Start
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// OpenAI Client nur auf Server-Seite
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: 'system',
          content: 'Analysiere den Sentiment des folgenden Textes. Antworte nur mit: POSITIVE, NEUTRAL oder NEGATIVE'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0,
      max_tokens: 10
    });

    const sentiment = completion.choices[0].message.content?.toLowerCase();
    let result: 'positive' | 'neutral' | 'negative' = 'neutral';

    if (sentiment?.includes('positive')) result = 'positive';
    if (sentiment?.includes('negative')) result = 'negative';

    return NextResponse.json({ sentiment: result });
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
} 