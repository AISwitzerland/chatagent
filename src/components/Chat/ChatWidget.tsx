'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import { Message, DataCollectionState, DataCollectionStep, UserContactData } from '../../types';
import { generateChatResponse } from '../../services/openaiService';
import { 
  getNextPrompt, 
  updateDataCollectionState, 
  validateInput 
} from '../../services/dataCollectionService';
import DocumentUpload from '../DocumentUpload/DocumentUpload';
import ChatInput from './ChatInput';

interface ChatError extends Error {
  code?: string;
  details?: unknown;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Willkommen bei Swiss Insurance! Wie kann ich Ihnen helfen?',
      role: 'assistant',
      created_at: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref für automatisches Scrollen
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll-Funktion
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Automatisches Scrollen bei neuen Nachrichten
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

  const addMessage = useCallback((message: Omit<Message, 'id' | 'created_at'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const handleDataCollection = useCallback(async (content: string): Promise<void> => {
    if (!content.trim()) return;

    const updatedState = updateDataCollectionState(dataCollection, content);
    
    // Validierungsfehler behandeln
    const validationError = validateInput(dataCollection.step, content);
    if (validationError) {
      addMessage({
        content: validationError,
        role: 'assistant'
      });
      return;
    }

    // Benutzereingabe zur Nachrichtenliste hinzufügen
    addMessage({
      content,
      role: 'user'
    });

    // Nächste Nachricht vom Assistenten
    const nextPrompt = getNextPrompt(updatedState.step, updatedState.data);
    if (nextPrompt) {
      addMessage({
        content: nextPrompt,
        role: 'assistant'
      });
    }

    setDataCollection(updatedState);
  }, [dataCollection, addMessage]);

  const handleSendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Wenn wir uns im Datenerfassungsmodus befinden
      if (dataCollection.step !== 'idle' && dataCollection.step !== 'ready_for_upload') {
        await handleDataCollection(content);
        return;
      }

      // Normale Chat-Nachricht
      const userMessage = addMessage({
        content,
        role: 'user'
      });

      // Prüfen ob Dokumenten-Upload gestartet werden soll
      if (content.toLowerCase().includes('dokument') || content.toLowerCase().includes('upload')) {
        setDataCollection({
          step: 'collecting_name',
          data: {},
          confirmed: false,
          retries: 0
        });
        
        addMessage({
          content: getNextPrompt('collecting_name', {}),
          role: 'assistant'
        });
      } else {
        try {
          // Normale OpenAI Antwort
          const aiResponse = await generateChatResponse([...messages, userMessage]);
          addMessage({
            content: aiResponse,
            role: 'assistant'
          });
        } catch (error) {
          const chatError = error as ChatError;
          console.error('OpenAI-Fehler:', {
            message: chatError.message,
            code: chatError.code,
            details: chatError.details
          });
          setError('Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht.');
          
          addMessage({
            content: 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut.',
            role: 'assistant'
          });
        }
      }
    } catch (error) {
      const chatError = error as ChatError;
      console.error('Chat-Fehler:', {
        message: chatError.message,
        code: chatError.code,
        details: chatError.details
      });
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  }, [messages, dataCollection, loading, handleDataCollection, addMessage]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Swiss Insurance Chat</h3>
              <p className="text-sm text-gray-500">Wir sind für Sie da</p>
            </div>
            <button
              onClick={toggleChat}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              </div>
            )}

            {/* Upload-Bereich */}
            {dataCollection.step === 'ready_for_upload' && dataCollection.data.name && dataCollection.data.email && (
              <div className="my-4 p-4 bg-blue-50 rounded-lg">
                <DocumentUpload
                  userData={dataCollection.data as UserContactData}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            )}
            
            {/* Scroll-Anker */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
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
      ) : (
        <ChatBubble onClick={toggleChat} />
      )}
    </div>
  );
}