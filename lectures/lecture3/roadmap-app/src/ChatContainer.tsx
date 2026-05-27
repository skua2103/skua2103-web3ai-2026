import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Bot } from 'lucide-react';
import './ChatContainer.css';

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
  isApiKeySet: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onOpenSettings,
  isApiKeySet
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !isLoading) {
        onSendMessage(inputText.trim());
        setInputText('');
      }
    }
  };

  return (
    <div className="chat-container glass-panel">
      <div className="chat-header">
        <div className="chat-title-group">
          <div className="chat-bot-avatar">
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div className="chat-title">ロードマップ AI</div>
            <div className="chat-subtitle">
              {isApiKeySet ? '⚡ Gemini API モード' : '✨ デモ・モックモード'}
            </div>
          </div>
        </div>
        <button 
          className="settings-btn" 
          onClick={onOpenSettings}
          title="APIキーを設定する"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-bubble ${msg.sender}`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message-bubble assistant typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input-field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="達成したい目標やタスクを入力してください..."
          disabled={isLoading}
          rows={1}
        />
        <button 
          type="submit" 
          className="chat-submit-btn"
          disabled={isLoading || !inputText.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
