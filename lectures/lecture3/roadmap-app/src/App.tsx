import React, { useState, useEffect, useRef } from 'react';
import { Bot, Key, RotateCcw, Flame } from 'lucide-react';
import { ChatContainer, type Message } from './ChatContainer';
import { RoadmapView } from './RoadmapView';
import { ApiKeySettings } from './ApiKeySettings';
import { Sidebar } from './Sidebar';
import { CheckInModal } from './CheckInModal';
import { generateRoadmapFromAI, chatWithAI, breakdownStep, type Roadmap, type RoadmapStep } from './geminiService';
import './App.css';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'assistant',
  text: 'こんにちは！私はあなたの目標達成を支援するロードマップアシスタントです。\n\n達成したいタスクや大きな目標を入力してください。AIがステップに分解して、実行可能なロードマップを作成します。',
  timestamp: new Date()
};

export const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false); // v4
  const [justCompletedStepId, setJustCompletedStepId] = useState<string | null>(null); // v4
  const [streak, setStreak] = useState(0); // v4
  const [freezingStepId, setFreezingStepId] = useState<string | null>(null); // v6
  const initialLoadDone = useRef(false);

  const activeRoadmap = roadmaps.find(r => r.id === activeRoadmapId) ?? null;

  // 初回ロード
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);

    // v4: ストリーク読み込み
    const savedStreak = parseInt(localStorage.getItem('streak_count') || '0', 10);
    setStreak(savedStreak);

    // v3: 複数ロードマップ読み込み（旧フォーマットからの移行含む）
    let loadedRoadmaps: Roadmap[] = [];
    const savedRoadmaps = localStorage.getItem('roadmaps_v2');
    if (savedRoadmaps) {
      try {
        loadedRoadmaps = JSON.parse(savedRoadmaps) as Roadmap[];
      } catch (e) {
        console.error('Failed to parse roadmaps', e);
      }
    } else {
      // v1フォーマットからの移行
      const legacy = localStorage.getItem('current_roadmap');
      if (legacy) {
        try {
          const rm = JSON.parse(legacy) as Partial<Roadmap>;
          const migrated: Roadmap = {
            id: rm.id || `roadmap-${Date.now()}`,
            title: rm.title || '移行済みロードマップ',
            description: rm.description || '',
            steps: rm.steps || [],
            createdAt: rm.createdAt || new Date().toISOString()
          };
          loadedRoadmaps = [migrated];
          localStorage.removeItem('current_roadmap');
        } catch (e) {
          console.error('Failed to migrate legacy roadmap', e);
        }
      }
    }

    setRoadmaps(loadedRoadmaps);
    if (loadedRoadmaps.length > 0) {
      setActiveRoadmapId(loadedRoadmaps[0].id);
    }

    // チャット履歴の復元
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as Message[];
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error('Failed to parse chat messages', e);
      }
    }

    // v4: 日次チェックイン判定
    const lastVisit = localStorage.getItem('last_visit_date');
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('last_visit_date', today);

    if (lastVisit !== today && loadedRoadmaps.length > 0) {
      const hasActiveSteps = loadedRoadmaps.some(rm =>
        rm.steps.some(s => s.status === 'doing' || s.status === 'todo')
      );
      if (hasActiveSteps) {
        setTimeout(() => setIsCheckInOpen(true), 600);
      }
    }
  }, []);

  // ロードマップをlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('roadmaps_v2', JSON.stringify(roadmaps));
  }, [roadmaps]);

  // チャット履歴をlocalStorageに保存
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // v4: ストリーク更新
  const updateStreak = () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastCompletion = localStorage.getItem('last_completion_date');
    if (lastCompletion === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const current = parseInt(localStorage.getItem('streak_count') || '0', 10);
    const newStreak = lastCompletion === yesterdayStr ? current + 1 : 1;

    localStorage.setItem('streak_count', newStreak.toString());
    localStorage.setItem('last_completion_date', today);
    setStreak(newStreak);
  };

  // チャット送信
  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const hasSteps = activeRoadmap && activeRoadmap.steps.length > 0;

      if (!hasSteps) {
        // v2/v3: ロードマップ生成モード
        const generated = await generateRoadmapFromAI(text, apiKey);

        if (activeRoadmapId && !activeRoadmap?.steps.length) {
          // 空の既存ロードマップを更新
          setRoadmaps(prev => prev.map(r =>
            r.id === activeRoadmapId ? { ...generated, id: r.id, createdAt: r.createdAt } : r
          ));
        } else {
          // 新規ロードマップとして追加
          setRoadmaps(prev => [...prev, generated]);
          setActiveRoadmapId(generated.id);
        }

        const assistantMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          sender: 'assistant',
          text: `「${text}」に向けたロードマップが完成しました！\n\n右側のタイムラインに実行ステップが表示されています。各ステップのステータスを更新したり、期限・メモを記録して活用してください。\n\n進捗の報告やアドバイスもいつでも聞いてください！`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // v2: 継続会話モード
        const response = await chatWithAI(activeRoadmap, text, apiKey);
        const assistantMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          sender: 'assistant',
          text: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'assistant',
        text: '申し訳ありません。エラーが発生しました。もう一度お試しいただくか、APIキー設定を確認してください。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStep = (stepId: string, updates: Partial<RoadmapStep>) => {
    if (!activeRoadmapId) return;

    // v4: 完了時の処理を事前チェック
    const currentStep = activeRoadmap?.steps.find(s => s.id === stepId);
    const isMarkingComplete = updates.status === 'done' && currentStep?.status !== 'done';

    setRoadmaps(prev => prev.map(rm => {
      if (rm.id !== activeRoadmapId) return rm;
      return {
        ...rm,
        steps: rm.steps.map(step => {
          if (step.id !== stepId) return step;
          const updated = { ...step, ...updates };
          if (isMarkingComplete) {
            updated.completedAt = new Date().toISOString();
          }
          return updated;
        })
      };
    }));

    if (isMarkingComplete) {
      setJustCompletedStepId(stepId);
      updateStreak();
      setTimeout(() => setJustCompletedStepId(null), 1200);
    }
  };

  const handleReorderSteps = (newSteps: RoadmapStep[]) => {
    if (!activeRoadmapId) return;
    setRoadmaps(prev => prev.map(rm =>
      rm.id === activeRoadmapId ? { ...rm, steps: newSteps } : rm
    ));
  };

  const handleUpdateRoadmap = (updates: { title?: string; description?: string }) => {
    if (!activeRoadmapId) return;
    setRoadmaps(prev => prev.map(rm =>
      rm.id === activeRoadmapId ? { ...rm, ...updates } : rm
    ));
  };

  const handleAddStep = (afterIndex?: number) => {
    if (!activeRoadmapId) return;
    const newStep: RoadmapStep = {
      id: `step-${Date.now()}`,
      title: '新しいステップ',
      description: 'このステップの説明を入力してください。',
      estimatedTime: '1週間',
      status: 'todo',
      notes: ''
    };
    setRoadmaps(prev => prev.map(rm => {
      if (rm.id !== activeRoadmapId) return rm;
      const newSteps = [...rm.steps];
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : newSteps.length;
      newSteps.splice(insertAt, 0, newStep);
      return { ...rm, steps: newSteps };
    }));
  };

  const handleDeleteStep = (stepId: string) => {
    if (!activeRoadmapId) return;
    setRoadmaps(prev => prev.map(rm =>
      rm.id === activeRoadmapId
        ? { ...rm, steps: rm.steps.filter(s => s.id !== stepId) }
        : rm
    ));
  };

  // v3: 新規ロードマップ作成
  const handleAddNewRoadmap = () => {
    const newRm: Roadmap = {
      id: `roadmap-${Date.now()}`,
      title: '新しいロードマップ',
      description: '',
      steps: [],
      createdAt: new Date().toISOString()
    };
    setRoadmaps(prev => [...prev, newRm]);
    setActiveRoadmapId(newRm.id);
    setMessages([WELCOME_MESSAGE]);
  };

  // v3: ロードマップ削除
  const handleDeleteRoadmap = (id: string) => {
    if (!window.confirm('このロードマップを削除しますか？')) return;
    setRoadmaps(prev => {
      const filtered = prev.filter(r => r.id !== id);
      if (activeRoadmapId === id) {
        setActiveRoadmapId(filtered.length > 0 ? filtered[0].id : null);
        setMessages([WELCOME_MESSAGE]);
      }
      return filtered;
    });
  };

  // v3: ロードマップ選択
  const handleSelectRoadmap = (id: string) => {
    setActiveRoadmapId(id);
  };

  // v4: チェックインアクション（doing / done に変更）
  const handleCheckInAction = (roadmapId: string, stepId: string, newStatus: 'doing' | 'done') => {
    const isMarkingComplete = newStatus === 'done';
    setRoadmaps(prev => prev.map(rm => {
      if (rm.id !== roadmapId) return rm;
      return {
        ...rm,
        steps: rm.steps.map(step => {
          if (step.id !== stepId) return step;
          return {
            ...step,
            status: newStatus,
            completedAt: isMarkingComplete ? new Date().toISOString() : step.completedAt
          };
        })
      };
    }));
    setActiveRoadmapId(roadmapId);
    if (isMarkingComplete) {
      setJustCompletedStepId(stepId);
      updateStreak();
      setTimeout(() => setJustCompletedStepId(null), 1200);
    }
  };

  // v6: フリーズ解消インジェクター
  const handleFreezeBreak = async (stepId: string) => {
    if (!activeRoadmapId || !activeRoadmap) return;
    const step = activeRoadmap.steps.find(s => s.id === stepId);
    if (!step) return;

    setFreezingStepId(stepId);
    try {
      const microTasks = await breakdownStep(step, apiKey);

      setRoadmaps(prev => prev.map(rm => {
        if (rm.id !== activeRoadmapId) return rm;
        const idx = rm.steps.findIndex(s => s.id === stepId);
        const newSteps = [...rm.steps];
        newSteps.splice(idx + 1, 0, ...microTasks);
        return { ...rm, steps: newSteps };
      }));

      const chatMsg: Message = {
        id: `msg-${Date.now()}-freeze`,
        sender: 'assistant',
        text: `「${step.title}」を ${microTasks.length} つの極小ステップに分解しました！\n\nロードマップに⚡マイクロタスクを追加したので、一番上から順番にこなすだけでOKです。まず最初の1つ（${microTasks[0]?.estimatedTime ?? '10分'}）だけやってみましょう。`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, chatMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setFreezingStepId(null);
    }
  };

  const handleReset = () => {
    if (window.confirm('すべてのロードマップと会話履歴を削除して初期状態に戻しますか？\n（APIキーとストリークは保持されます）')) {
      setMessages([WELCOME_MESSAGE]);
      setRoadmaps([]);
      setActiveRoadmapId(null);
      localStorage.removeItem('roadmaps_v2');
      localStorage.removeItem('chat_messages');
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-badge">
            <Bot size={20} color="#fff" />
          </div>
          <h1 className="logo-text">AI Roadmap Generator</h1>
        </div>

        <div className="header-actions">
          {/* v4: ストリーク表示 */}
          {streak > 0 && (
            <div className="streak-badge">
              <Flame size={13} color="#f59e0b" />
              <span>{streak}日連続</span>
            </div>
          )}

          <div
            className="key-status-badge"
            onClick={() => setIsSettingsOpen(true)}
            title="APIキーを設定する"
          >
            <Key size={13} color={apiKey ? '#8b5cf6' : '#9ca3af'} />
            <span>{apiKey ? 'API接続中' : 'デモモード'}</span>
            <div className={`key-status-dot ${apiKey ? 'active' : 'inactive'}`} />
          </div>

          <button className="reset-btn" onClick={handleReset} title="データを初期化する">
            <RotateCcw size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            リセット
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* v3: サイドバー */}
        <Sidebar
          roadmaps={roadmaps}
          activeRoadmapId={activeRoadmapId}
          onSelect={handleSelectRoadmap}
          onAdd={handleAddNewRoadmap}
          onDelete={handleDeleteRoadmap}
        />

        {/* v2: 継続会話対応チャット */}
        <ChatContainer
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isApiKeySet={!!apiKey}
          hasRoadmap={!!activeRoadmap && activeRoadmap.steps.length > 0}
          onAddNewRoadmap={handleAddNewRoadmap}
        />

        {/* v2: 進捗バー・v3: 期限・エクスポート・v4: 完了アニメーション・v6: フリーズ解消 */}
        <RoadmapView
          roadmap={activeRoadmap}
          onUpdateStep={handleUpdateStep}
          onReorderSteps={handleReorderSteps}
          onUpdateRoadmap={handleUpdateRoadmap}
          onAddStep={handleAddStep}
          onDeleteStep={handleDeleteStep}
          justCompletedStepId={justCompletedStepId}
          onFreezeBreak={handleFreezeBreak}
          freezingStepId={freezingStepId}
        />
      </main>

      <ApiKeySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={key => setApiKey(key)}
      />

      {/* v4: 日次チェックインモーダル */}
      <CheckInModal
        isOpen={isCheckInOpen}
        streak={streak}
        onClose={() => setIsCheckInOpen(false)}
        roadmaps={roadmaps}
        onAction={handleCheckInAction}
      />
    </div>
  );
};

export default App;
