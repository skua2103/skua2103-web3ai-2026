import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Bot, Plus } from 'lucide-react';
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
  hasRoadmap: boolean;      // v2: ロードマップ生成済みかどうか
  onAddNewRoadmap: () => void; // v3: 新規ロードマップ作成
}

// v2: クイック入力候補
const INITIAL_SUGGESTIONS = [
  { emoji: '⚛️', label: 'Reactを習得したい' },
  { emoji: '🔗', label: 'Web3を学びたい' },
  { emoji: '💼', label: '就活の準備をしたい' },
  { emoji: '🌏', label: '英語力を上げたい' },
];

const FOLLOWUP_SUGGESTIONS = [
  { emoji: '📊', label: '進捗を報告する' },
  { emoji: '💡', label: 'アドバイスをください' },
  { emoji: '😓', label: 'つまずいています' },
  { emoji: '✅', label: 'ステップが完了しました' },
];

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onOpenSettings,
  isApiKeySet,
  hasRoadmap,
  onAddNewRoadmap
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

  const handleSuggestion = (label: string) => {
    if (isLoading) return;
    onSendMessage(label);
  };

  const suggestions = hasRoadmap ? FOLLOWUP_SUGGESTIONS : INITIAL_SUGGESTIONS;

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
              {hasRoadmap && <span className="chat-mode-tag">会話モード</span>}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          {hasRoadmap && (
            <button
              className="new-roadmap-btn"
              onClick={onAddNewRoadmap}
              title="新しいロードマップを作成"
            >
              <Plus size={14} />
              新規
            </button>
          )}
          <button
            className="settings-btn"
            onClick={onOpenSettings}
            title="APIキーを設定する"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
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

      {/* v2: クイック入力ボタン */}
      <div className="suggestions-row">
        {suggestions.map(s => (
          <button
            key={s.label}
            className="suggestion-chip"
            onClick={() => handleSuggestion(s.label)}
            disabled={isLoading}
          >
            <span>{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input-field"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasRoadmap
              ? 'AIに進捗を報告・相談する...'
              : '達成したい目標やタスクを入力してください...'
          }
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
