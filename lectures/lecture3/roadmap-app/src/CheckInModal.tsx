import React from 'react';
import { Sun, CheckCircle2, ArrowRight, X, Flame } from 'lucide-react';
import type { Roadmap } from './geminiService';
import './CheckInModal.css';

interface CheckInModalProps {
  isOpen: boolean;
  streak: number;
  onClose: () => void;
  roadmaps: Roadmap[];
  onAction: (roadmapId: string, stepId: string, newStatus: 'doing' | 'done') => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen, streak, onClose, roadmaps, onAction
}) => {
  if (!isOpen) return null;

  const doingItems = roadmaps.flatMap(rm =>
    rm.steps
      .filter(s => s.status === 'doing')
      .map(s => ({ step: s, roadmap: rm }))
  );

  const todoItems = roadmaps.flatMap(rm =>
    rm.steps
      .filter(s => s.status === 'todo')
      .slice(0, 2)
      .map(s => ({ step: s, roadmap: rm }))
  ).slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'こんばんは';

  return (
    <div className="checkin-overlay" onClick={onClose}>
      <div
        className="checkin-modal glass-panel animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <button className="checkin-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="checkin-header">
          <div className="checkin-sun-icon">
            <Sun size={24} color="#f59e0b" />
          </div>
          <h2 className="checkin-title">{greeting}！</h2>
          <p className="checkin-subtitle">今日もロードマップを一歩進めましょう 🚀</p>
          {streak > 0 && (
            <div className="checkin-streak">
              <Flame size={14} color="#f59e0b" />
              <span>{streak}日連続継続中！</span>
            </div>
          )}
        </div>

        {doingItems.length > 0 && (
          <div className="checkin-section">
            <div className="checkin-section-label">進行中のステップ</div>
            {doingItems.map(({ step, roadmap }) => (
              <div key={step.id} className="checkin-step-item doing">
                <div className="checkin-step-info">
                  <div className="checkin-step-title">{step.title}</div>
                  <div className="checkin-step-roadmap">{roadmap.title}</div>
                </div>
                <button
                  className="checkin-action-btn done"
                  onClick={() => { onAction(roadmap.id, step.id, 'done'); onClose(); }}
                >
                  <CheckCircle2 size={13} />
                  完了にする
                </button>
              </div>
            ))}
          </div>
        )}

        {todoItems.length > 0 && (
          <div className="checkin-section">
            <div className="checkin-section-label">今日始められるステップ</div>
            {todoItems.map(({ step, roadmap }) => (
              <div key={step.id} className="checkin-step-item todo">
                <div className="checkin-step-info">
                  <div className="checkin-step-title">{step.title}</div>
                  <div className="checkin-step-roadmap">{roadmap.title}</div>
                </div>
                <button
                  className="checkin-action-btn start"
                  onClick={() => { onAction(roadmap.id, step.id, 'doing'); onClose(); }}
                >
                  <ArrowRight size={13} />
                  開始する
                </button>
              </div>
            ))}
          </div>
        )}

        {doingItems.length === 0 && todoItems.length === 0 && (
          <div className="checkin-all-done">
            <CheckCircle2 size={36} color="var(--accent-emerald)" />
            <p>全ステップ完了！新しい目標を設定しましょう。</p>
          </div>
        )}

        <button className="checkin-later-btn" onClick={onClose}>
          後で確認する
        </button>
      </div>
    </div>
  );
};
