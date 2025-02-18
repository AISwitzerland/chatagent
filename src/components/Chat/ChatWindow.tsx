'use client';

import React, { useState, useEffect } from 'react';
import { Message } from '../../types';
import DocumentUpload from '../DocumentUpload/DocumentUpload';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  onClose: () => void;
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Willkommen bei Swiss Insurance! Wie kann ich Ihnen helfen?',
      role: 'assistant',
      created_at: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Überprüfe Bot-Antworten auf Upload-Trigger
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && 
        lastMessage.content.includes('Ich aktiviere jetzt den Upload-Bereich')) {
      setShowUpload(true);
    }
  }, [messages]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: 'Dokument erfolgreich hochgeladen! Die Verarbeitung wurde gestartet. Kann ich Ihnen noch bei etwas anderem helfen?',
      role: 'assistant',
      created_at: new Date().toISOString()
    }]);
  };

  const handleUploadError = (error: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: `Beim Upload ist ein Fehler aufgetreten: ${error}. Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support.`,
      role: 'assistant',
      created_at: new Date().toISOString()
    }]);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          language: 'de'
        }),
      });

      if (!response.ok) throw new Error('Fehler bei der Kommunikation');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        role: 'assistant',
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.',
        role: 'assistant',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-96 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Swiss Insurance Chat</h3>
          <p className="text-sm text-gray-500">Wir sind für Sie da</p>
        </div>
        <button
          onClick={onClose}
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
        {isLoading && (
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
        {showUpload && (
          <div className="my-4 p-4 bg-blue-50 rounded-lg">
            <DocumentUpload
              userData={{
                name: 'Test User',
                email: 'test@example.com',
                phone: ''
              }}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Ihre Nachricht..."
        />
      </div>
    </div>
  );
} 