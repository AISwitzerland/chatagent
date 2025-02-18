import { supabase } from './supabaseClient';
import { _Message } from '@/types/chat';
import { _detectIntents } from './intentService';
import { analyzeSentiment, generateChatResponse } from './openaiService';
import { processIntent } from './intentService';
import { detectLanguage } from './languageService';

export async function createChat(userId: string, language: string = 'de') {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      language,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendMessage(content: string, attachments?: string[]) {
  try {
    // 1. Sprache erkennen
    const language = await detectLanguage(content);

    // 2. Intent & Sentiment analysieren
    let intent = null;
    let sentiment = 'neutral';
    try {
      [intent, sentiment] = await Promise.all([processIntent(content), analyzeSentiment(content)]);
    } catch (error) {
      console.error('Analysis Error:', error);
      // Weitermachen mit Standardwerten
    }

    // 3. Nachricht speichern
    const { data: userMessage, error: userError } = await supabase
      .from('messages')
      .insert({
        content,
        role: 'user',
        attachments,
        intent,
        sentiment,
        language,
      })
      .select()
      .single();

    if (userError) {
      console.error('Supabase Error:', userError);
      throw new Error('Failed to save message');
    }

    // 4. OpenAI Antwort generieren
    const aiResponse = await generateChatResponse([userMessage], language);

    // 5. AI Antwort speichern
    const { data: assistantMessage, error: assistantError } = await supabase
      .from('messages')
      .insert({
        content: aiResponse,
        role: 'assistant',
        language,
      })
      .select()
      .single();

    if (assistantError) throw assistantError;

    return {
      userMessage,
      assistantMessage,
    };
  } catch (error) {
    console.error('Message Error:', error);
    throw error;
  }
}

export async function getChatHistory(chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
