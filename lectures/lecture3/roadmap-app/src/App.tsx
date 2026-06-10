import React, { useState, useEffect } from 'react';
import { Bot, Key, RotateCcw } from 'lucide-react';
import { ChatContainer, type Message } from './ChatContainer';
import { RoadmapView } from './RoadmapView';
import { ApiKeySettings } from './ApiKeySettings';
import { generateRoadmapFromAI, type Roadmap, type RoadmapStep } from './geminiService';
import './App.css';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'assistant',
  text: 'こんにちは！私はあなたの目標達成を支援するロードマップアシスタントです。あなたが今から達成したいタスクや大きな目標を教えてください。(例: 「ReactとTypeScriptをマスターしたい」「Web3の基礎を学習したい」など)',
  timestamp: new Date()
};

export const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // 初回ロード時にLocalStorageからデータを復元
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);

    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as Message[];
        // Date型への変換
        const normalized = parsed.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(normalized);
      } catch (e) {
        console.error('Failed to parse chat messages', e);
      }
    }

    const savedRoadmap = localStorage.getItem('current_roadmap');
    if (savedRoadmap) {
      try {
        setRoadmap(JSON.parse(savedRoadmap) as Roadmap);
      } catch (e) {
        console.error('Failed to parse roadmap', e);
      }
    }
  }, []);

  // メッセージやロードマップが更新されたらLocalStorageに保存
  useEffect(() => {
    if (messages.length > 1) { // 初期メッセージのみの場合は保存しない、またはしても問題なし
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (roadmap) {
      localStorage.setItem('current_roadmap', JSON.stringify(roadmap));
    } else {
      localStorage.removeItem('current_roadmap');
    }
  }, [roadmap]);

  const handleSendMessage = async (text: string) => {
    // ユーザーメッセージを追加
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // AIからロードマップ生成を実行
      const generatedRoadmap = await generateRoadmapFromAI(text, apiKey);
      setRoadmap(generatedRoadmap);

      // AIのアシスタント返答メッセージを追加
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: `「${text}」に向けたロードマップが完成しました！\n右側のタイムラインパネルに表示されています。各ステップの進捗を変更したり、作成意図や振り返りメモを自由に記録して、いつでも振り返れるように活用してください！`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'assistant',
        text: '申し訳ありません。ロードマップの生成中にエラーが発生しました。もう一度お試しいただくか、APIキー設定を確認してください。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStep = (stepId: string, updates: Partial<RoadmapStep>) => {
    if (!roadmap) return;
    const updatedSteps = roadmap.steps.map(step => {
      if (step.id === stepId) {
        return { ...step, ...updates };
      }
      return step;
    });
    setRoadmap({
      ...roadmap,
      steps: updatedSteps
    });
  };

  const handleReorderSteps = (newSteps: RoadmapStep[]) => {
    if (!roadmap) return;
    setRoadmap({
      ...roadmap,
      steps: newSteps
    });
  };

  const handleReset = () => {
    if (window.confirm('すべての会話履歴、ロードマップ、記録した意図メモを削除して初期状態に戻しますか？ (APIキーは保持されます)')) {
      setMessages([WELCOME_MESSAGE]);
      setRoadmap(null);
      localStorage.removeItem('chat_messages');
      localStorage.removeItem('current_roadmap');
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-badge">
            <Bot size={22} color="#fff" />
          </div>
          <h1 className="logo-text" id="app-title">AI Roadmap Generator</h1>
        </div>

        <div className="header-actions">
          <div 
            className="key-status-badge"
            onClick={() => setIsSettingsOpen(true)}
            title="APIキーを設定する"
          >
            <Key size={14} color={apiKey ? '#8b5cf6' : '#9ca3af'} />
            <span>{apiKey ? 'API接続中' : 'デモモード'}</span>
            <div className={`key-status-dot ${apiKey ? 'active' : 'inactive'}`} />
          </div>

          <button className="reset-btn" onClick={handleReset} title="データを初期化する">
            <RotateCcw size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            リセット
          </button>
        </div>
      </header>

      <main className="main-content">
        <ChatContainer
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isApiKeySet={!!apiKey}
        />
        
        <RoadmapView
          roadmap={roadmap}
          onUpdateStep={handleUpdateStep}
          onReorderSteps={handleReorderSteps}
        />
      </main>

      <ApiKeySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(key) => setApiKey(key)}
      />
    </div>
  );
};

export default App;
