'use client';

import React, { useState } from 'react';
import ChatBubble from './ChatBubble';
import { useCallback } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[600px] transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Swiss Insurance Chat</h3>
            <button onClick={toggleChat} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
            {/* Chat content will go here */}
            <div className="flex flex-col space-y-4">
              <div className="bg-blue-100 p-3 rounded-lg self-start max-w-[80%]">
                <p>Willkommen bei Swiss Insurance! Wie kann ich Ihnen helfen?</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ChatBubble onClick={toggleChat} />
      )}
    </div>
  );
}
