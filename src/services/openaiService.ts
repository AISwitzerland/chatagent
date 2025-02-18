import { Message } from '../types';

// Nur Client-seitige Funktionen, kein OpenAI Client hier
export async function generateChatResponse(
  messages: Message[],
  language: string = 'de'
): Promise<string> {
  try {
    console.log('Sending messages to API:', messages);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate response');
    }

    return data.content;
  } catch (error) {
    console.error('Detailed Chat API Error:', error);
    throw error;
  }
}

export async function analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
  try {
    const response = await fetch('/api/analyze-sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze sentiment');
    }

    const data = await response.json();
    return data.sentiment;
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return 'neutral';
  }
}
