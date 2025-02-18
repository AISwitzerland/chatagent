'use client';

import React from 'react';
import { Message, UserContactData } from '../../types';
import { useEffect, useRef } from 'react';
import DocumentUpload from '../DocumentUpload/DocumentUpload';

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
  showUpload?: boolean;
  userData?: UserContactData;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

export default function ChatMessages({
  messages,
  loading,
  showUpload = false,
  userData,
  onUploadComplete,
  onUploadError,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 ${
              message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
      {showUpload && userData && (
        <div className="mt-4">
          <DocumentUpload
            userData={userData}
            onUploadComplete={onUploadComplete}
            onUploadError={onUploadError}
          />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
