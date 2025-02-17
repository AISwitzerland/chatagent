'use client';

import React, { useState, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import { Message, DataCollectionState, DataCollectionStep } from '../../types';
import { generateChatResponse } from '../../services/openaiService';
import { 
  getNextPrompt, 
  updateDataCollectionState, 
  validateInput 
} from '../../services/dataCollectionService';
import DocumentUpload from '../DocumentUpload/DocumentUpload';

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
  const [inputMessage, setInputMessage] = useState('');
  
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
    if (!content.trim()) return;

    setLoading(true);
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
      setInputMessage('');

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
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.',
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages, dataCollection]);

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

            {/* Upload-Bereich */}
            {dataCollection.step === 'ready_for_upload' && (
              <div className="my-4 p-4 bg-blue-50 rounded-lg">
                <DocumentUpload
                  userData={dataCollection.data}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
                placeholder={
                  dataCollection.step !== 'idle' 
                    ? "Bitte beantworten Sie die Frage..." 
                    : "Schreiben Sie eine Nachricht..."
                }
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Senden
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ChatBubble onClick={toggleChat} />
      )}
    </div>
  );
}