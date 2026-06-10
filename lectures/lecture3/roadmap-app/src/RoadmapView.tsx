import React, { useState } from 'react';
import { Check, Clock, FileText, Map, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import type { Roadmap, RoadmapStep } from './geminiService';
import './RoadmapView.css';

interface RoadmapViewProps {
  roadmap: Roadmap | null;
  onUpdateStep: (stepId: string, updates: Partial<RoadmapStep>) => void;
  onReorderSteps: (newSteps: RoadmapStep[]) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onUpdateStep, onReorderSteps }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggable, setIsDraggable] = useState<boolean>(false);

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

  // ドラッグ＆ドロップロジック
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSteps = [...roadmap.steps];
    const [movedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, movedStep);
    
    onReorderSteps(newSteps);

    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDraggable(false);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDraggable(false);
  };

  // ボタンによる順序入れ替え
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= roadmap.steps.length) return;

    const newSteps = [...roadmap.steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    
    onReorderSteps(newSteps);
  };

  return (
    <div className="roadmap-container glass-panel animate-fade-in">
      <div className="roadmap-header-section">
        <h2 className="roadmap-title">{roadmap.title}</h2>
        <p className="roadmap-description">{roadmap.description}</p>
      </div>

      <div className="roadmap-timeline">
        {roadmap.steps.map((step, index) => {
          const isDone = step.status === 'done';
          const isDoing = step.status === 'doing';
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;
          
          return (
            <div 
              key={step.id} 
              className={`roadmap-step-card todo ${step.status} ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''}`}
              draggable={isDraggable}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => handleDragLeave(index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
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
                <div className="step-title-area">
                  <div 
                    className="drag-handle"
                    onMouseEnter={() => setIsDraggable(true)}
                    onMouseLeave={() => {
                      if (draggedIndex === null) {
                        setIsDraggable(false);
                      }
                    }}
                    title="ドラッグして順番を動かす"
                  >
                    <GripVertical size={16} />
                  </div>
                  <h4 className="step-title">{step.title}</h4>
                </div>
                
                <div className="step-meta">
                  <div className="reorder-buttons">
                    <button
                      className="reorder-btn"
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                      title="上に移動"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      className="reorder-btn"
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === roadmap.steps.length - 1}
                      title="下に移動"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

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
                  onFocus={() => setIsDraggable(false)} // フォーカス時にもドラッグ無効化で安全確保
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
