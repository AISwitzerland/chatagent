'use client';

import React, { useState, useCallback } from 'react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Message, DataCollectionState, DataCollectionStep, UserContactData } from '../../types';
import { generateChatResponse } from '../../services/openaiService';
import { 
  getNextPrompt, 
  updateDataCollectionState, 
  validateInput 
} from '../../services/dataCollectionService';

// Aktualisiere die Props der Komponenten
interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  showUpload?: boolean;
  userData?: UserContactData;
  onUploadComplete: () => void;
  onUploadError: (errorMessage: string) => void;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Zustand für die Datenerfassung
  const [dataCollection, setDataCollection] = useState<DataCollectionState>({
    step: 'idle',
    data: {},
    confirmed: false,
    retries: 0
  });

  const handleUploadComplete = useCallback(() => {
    const successMessage: Message = {
      id: Date.now().toString(),
      content: 'Vielen Dank! Ihr Dokument wurde erfolgreich hochgeladen und wird nun verarbeitet.',
      role: 'assistant',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, successMessage]);
    
    // Zurück zum normalen Chat-Modus
    setDataCollection(prev => ({
      ...prev,
      step: 'idle'
    }));
  }, []);

  const handleUploadError = useCallback((errorMessage: string) => {
    const errorMsg: Message = {
      id: Date.now().toString(),
      content: `Es gab ein Problem beim Hochladen: ${errorMessage}`,
      role: 'assistant',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, errorMsg]);
  }, []);

  const handleDataCollection = useCallback(async (content: string) => {
    const updatedState = updateDataCollectionState(dataCollection, content);
    
    // Validierungsfehler behandeln
    const validationError = validateInput(dataCollection.step, content);
    if (validationError) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: validationError,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Benutzereingabe zur Nachrichtenliste hinzufügen
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Nächste Nachricht vom Assistenten
    const nextPrompt = getNextPrompt(updatedState.step, updatedState.data);
    if (nextPrompt) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: nextPrompt,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }

    setDataCollection(updatedState);
  }, [dataCollection]);

  const handleSendMessage = useCallback(async (content: string) => {
    setLoading(true);
    setError(null);

    try {
      // Wenn wir uns im Datenerfassungsmodus befinden
      if (dataCollection.step !== 'idle' && dataCollection.step !== 'ready_for_upload') {
        await handleDataCollection(content);
        setLoading(false);
        return;
      }

      // Normale Chat-Nachricht
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Prüfen ob Dokumenten-Upload gestartet werden soll
      if (content.toLowerCase().includes('dokument') || content.toLowerCase().includes('upload')) {
        setDataCollection({
          step: 'collecting_name',
          data: {},
          confirmed: false,
          retries: 0
        });
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getNextPrompt('collecting_name', {}),
          role: 'assistant',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Normale OpenAI Antwort
        const aiResponse = await generateChatResponse([...messages, userMessage]);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          role: 'assistant',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat Error:', error);
      setError(error.message || 'Fehler bei der Kommunikation mit dem Assistenten');
    } finally {
      setLoading(false);
    }
  }, [messages, dataCollection]);

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-lg">
      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      <ChatMessages
        messages={messages}
        loading={loading}
        showUpload={dataCollection.step === 'ready_for_upload'}
        userData={dataCollection.step === 'ready_for_upload' && dataCollection.data.name && dataCollection.data.email ? 
          dataCollection.data as UserContactData : 
          undefined
        }
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
      <div className="p-4 border-t bg-white rounded-b-lg">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={loading}
          placeholder={
            dataCollection.step !== 'idle' 
              ? "Bitte beantworten Sie die Frage..." 
              : "Schreiben Sie eine Nachricht..."
          }
        />
      </div>
    </div>
  );
} 