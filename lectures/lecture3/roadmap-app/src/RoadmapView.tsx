import React from 'react';
import { Check, Clock, FileText, Map } from 'lucide-react';
import type { Roadmap, RoadmapStep } from './geminiService';
import './RoadmapView.css';

interface RoadmapViewProps {
  roadmap: Roadmap | null;
  onUpdateStep: (stepId: string, updates: Partial<RoadmapStep>) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onUpdateStep }) => {
  if (!roadmap) {
    return (
      <div className="roadmap-container glass-panel">
        <div className="roadmap-empty">
          <div className="roadmap-empty-icon">
            <Map size={32} color="#8b5cf6" />
          </div>
          <h3>ロードマップは未作成です</h3>
          <p style={{ maxWidth: '320px', fontSize: '13px', lineHeight: '1.6' }}>
            左側のAIチャットボットに「達成したい目標やタスク」を入力して送信すると、ここに実行ステップが自動生成されます。
          </p>
        </div>
      </div>
    );
  }

  const handleStatusChange = (stepId: string, status: 'todo' | 'doing' | 'done') => {
    onUpdateStep(stepId, { status });
  };

  const handleNotesChange = (stepId: string, notes: string) => {
    onUpdateStep(stepId, { notes });
  };

  return (
    <div className="roadmap-container glass-panel animate-fade-in">
      <div className="roadmap-header-section">
        <h2 className="roadmap-title">{roadmap.title}</h2>
        <p className="roadmap-description">{roadmap.description}</p>
      </div>

      <div className="roadmap-timeline">
        {roadmap.steps.map((step) => {
          const isDone = step.status === 'done';
          const isDoing = step.status === 'doing';
          
          return (
            <div 
              key={step.id} 
              className={`roadmap-step-card todo ${step.status}`}
            >
              <div className="roadmap-step-dot">
                {isDone ? (
                  <Check size={12} color="#fff" />
                ) : isDoing ? (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                ) : (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6b7280' }} />
                )}
              </div>

              <div className="step-card-header">
                <h4 className="step-title">{step.title}</h4>
                <div className="step-meta">
                  <span className="step-time-badge">
                    <Clock size={11} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                    {step.estimatedTime}
                  </span>
                  
                  <div className="status-selector">
                    <button
                      className={`status-btn ${step.status === 'todo' ? 'active todo' : ''}`}
                      onClick={() => handleStatusChange(step.id, 'todo')}
                    >
                      未着手
                    </button>
                    <button
                      className={`status-btn ${step.status === 'doing' ? 'active doing' : ''}`}
                      onClick={() => handleStatusChange(step.id, 'doing')}
                    >
                      進行中
                    </button>
                    <button
                      className={`status-btn ${step.status === 'done' ? 'active done' : ''}`}
                      onClick={() => handleStatusChange(step.id, 'done')}
                    >
                      完了
                    </button>
                  </div>
                </div>
              </div>

              <p className="step-description">{step.description}</p>

              <div className="step-notes-section">
                <div className="step-notes-header">
                  <FileText size={12} />
                  <span>作成意図・振り返りメモ (振り返り用)</span>
                </div>
                <textarea
                  className="step-notes-textarea"
                  value={step.notes}
                  onChange={(e) => handleNotesChange(step.id, e.target.value)}
                  placeholder="なぜこの順序で計画したか、実行時にどんな気づきがあったかなどをメモしておけます..."
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
