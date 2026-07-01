import React, { useState } from 'react';
import { Check, Clock, FileText, Map, ChevronUp, ChevronDown, GripVertical, Trash2, Plus, Copy, CheckCheck, Calendar, AlertCircle, Zap, Loader2 } from 'lucide-react';
import type { Roadmap, RoadmapStep } from './geminiService';
import './RoadmapView.css';

interface RoadmapViewProps {
  roadmap: Roadmap | null;
  onUpdateStep: (stepId: string, updates: Partial<RoadmapStep>) => void;
  onReorderSteps: (newSteps: RoadmapStep[]) => void;
  onUpdateRoadmap: (updates: { title?: string; description?: string }) => void;
  onAddStep: (afterIndex?: number) => void;
  onDeleteStep: (stepId: string) => void;
  justCompletedStepId: string | null; // v4: 完了アニメーション
  onFreezeBreak: (stepId: string) => void; // v6: フリーズ解消
  freezingStepId: string | null;           // v6: 分解中のステップID
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap, onUpdateStep, onReorderSteps, onUpdateRoadmap,
  onAddStep, onDeleteStep, justCompletedStepId,
  onFreezeBreak, freezingStepId
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggable, setIsDraggable] = useState(false);
  const [exportCopied, setExportCopied] = useState(false); // v3

  if (!roadmap) {
    return (
      <div className="roadmap-container glass-panel">
        <div className="roadmap-empty">
          <div className="roadmap-empty-icon">
            <Map size={32} color="#8b5cf6" />
          </div>
          <h3>ロードマップは未作成です</h3>
          <p style={{ maxWidth: '300px', fontSize: '13px', lineHeight: '1.6' }}>
            左側のAIチャットに「達成したい目標やタスク」を入力して送信すると、実行ステップが自動生成されます。
          </p>
        </div>
      </div>
    );
  }

  // v2: 進捗計算
  const doneCount = roadmap.steps.filter(s => s.status === 'done').length;
  const totalCount = roadmap.steps.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleStatusChange = (stepId: string, status: 'todo' | 'doing' | 'done') => {
    onUpdateStep(stepId, { status });
  };

  const handleNotesChange = (stepId: string, notes: string) => {
    onUpdateStep(stepId, { notes });
  };

  const handleDeleteStep = (stepId: string) => {
    if (window.confirm('このステップを削除しますか？')) {
      onDeleteStep(stepId);
    }
  };

  // v3: Markdownエクスポート
  const handleExport = () => {
    const today = new Date().toLocaleDateString('ja-JP');
    const statusLabel = (s: RoadmapStep) =>
      s.status === 'done' ? '✅ 完了' : s.status === 'doing' ? '⏳ 進行中' : '⬜ 未着手';

    const md = [
      `# ${roadmap.title}`,
      `> エクスポート日: ${today} | 進捗: ${doneCount}/${totalCount} ステップ (${progressPercent}%)`,
      '',
      roadmap.description,
      '',
      '---',
      '',
      '## ステップ一覧',
      '',
      ...roadmap.steps.flatMap((s, i) => [
        `### ${i + 1}. ${s.title}`,
        `- **ステータス**: ${statusLabel(s)}`,
        `- **所要時間**: ${s.estimatedTime}`,
        s.deadline ? `- **期限**: ${s.deadline}` : '',
        '',
        s.description,
        '',
        s.notes ? `> 📝 メモ: ${s.notes}` : '',
        '',
      ].filter(line => line !== null && line !== undefined))
    ].join('\n');

    navigator.clipboard.writeText(md).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2200);
    });
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
    if (dragOverIndex === index) setDragOverIndex(null);
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

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= roadmap.steps.length) return;
    const newSteps = [...roadmap.steps];
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    onReorderSteps(newSteps);
  };

  return (
    <div className="roadmap-container glass-panel animate-fade-in">
      <div className="roadmap-header-section">
        <div className="roadmap-header-top">
          <input
            className="roadmap-title-input"
            value={roadmap.title}
            onChange={e => onUpdateRoadmap({ title: e.target.value })}
            placeholder="ロードマップのタイトル"
          />
          {/* v3: エクスポートボタン */}
          <button
            className={`export-btn ${exportCopied ? 'copied' : ''}`}
            onClick={handleExport}
            title="Markdownでコピー"
          >
            {exportCopied ? <><CheckCheck size={13} /> コピー済み</> : <><Copy size={13} /> エクスポート</>}
          </button>
        </div>

        <textarea
          className="roadmap-description-textarea"
          value={roadmap.description}
          onChange={e => onUpdateRoadmap({ description: e.target.value })}
          placeholder="ロードマップの概要を入力..."
          rows={2}
        />

        {/* v2: 進捗バー */}
        {totalCount > 0 && (
          <div className="progress-section">
            <div className="progress-stats">
              <span className="progress-label">進捗</span>
              <span className="progress-count">{doneCount} / {totalCount} ステップ</span>
              <span className="progress-percent">{progressPercent}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="roadmap-timeline">
        {roadmap.steps.map((step, index) => {
          const isDone = step.status === 'done';
          const isDoing = step.status === 'doing';
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;
          const isJustCompleted = justCompletedStepId === step.id; // v4

          // v3: 期限チェック
          const isOverdue = step.deadline && step.status !== 'done'
            && new Date(step.deadline + 'T23:59:59') < new Date();
          // v6: マイクロタスク判定
          const isMicro = !!step.isMicroTask;
          const isFreezing = freezingStepId === step.id;

          return (
            <div
              key={step.id}
              className={[
                'roadmap-step-card',
                step.status,
                isDragging ? 'dragging' : '',
                isOver ? 'drag-over' : '',
                isJustCompleted ? 'just-completed' : '',
                isOverdue ? 'overdue' : '',
                isMicro ? 'micro-task' : ''
              ].filter(Boolean).join(' ')}
              draggable={isDraggable}
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragLeave={() => handleDragLeave(index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="roadmap-step-dot">
                {isDone ? (
                  <Check size={12} color="#fff" />
                ) : isDoing ? (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#6b7280' }} />
                )}
              </div>

              <div className="step-card-header">
                {/* 行1: タイトル（全幅） */}
                <div className="step-title-row">
                  <div
                    className="drag-handle"
                    onMouseEnter={() => setIsDraggable(true)}
                    onMouseLeave={() => { if (draggedIndex === null) setIsDraggable(false); }}
                    title="ドラッグして順番を動かす"
                  >
                    <GripVertical size={16} />
                  </div>
                  {/* v6: マイクロタスクバッジ */}
                  {isMicro && (
                    <span className="micro-task-badge">
                      <Zap size={10} />
                      今すぐ
                    </span>
                  )}
                  <input
                    className="step-title-input"
                    value={step.title}
                    onChange={e => onUpdateStep(step.id, { title: e.target.value })}
                    onFocus={() => setIsDraggable(false)}
                    placeholder="ステップのタイトル"
                  />
                  <button
                    className="step-delete-btn"
                    onClick={() => handleDeleteStep(step.id)}
                    title="このステップを削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 行2: 所要時間・ステータス・並び替え */}
                <div className="step-meta-row">
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

                  <label className="step-time-badge" title="所要時間を編集">
                    <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline-block', flexShrink: 0 }} />
                    <input
                      className="step-time-input"
                      value={step.estimatedTime}
                      onChange={e => onUpdateStep(step.id, { estimatedTime: e.target.value })}
                      onFocus={() => setIsDraggable(false)}
                    />
                  </label>

                  <div className="status-selector">
                    <button
                      className={`status-btn ${step.status === 'todo' ? 'active todo' : ''}`}
                      onClick={() => handleStatusChange(step.id, 'todo')}
                    >未着手</button>
                    <button
                      className={`status-btn ${step.status === 'doing' ? 'active doing' : ''}`}
                      onClick={() => handleStatusChange(step.id, 'doing')}
                    >進行中</button>
                    <button
                      className={`status-btn ${step.status === 'done' ? 'active done' : ''}`}
                      onClick={() => handleStatusChange(step.id, 'done')}
                    >完了</button>
                  </div>
                </div>
              </div>

              <textarea
                className="step-description-textarea"
                value={step.description}
                onChange={e => onUpdateStep(step.id, { description: e.target.value })}
                onFocus={() => setIsDraggable(false)}
                placeholder="このステップの説明を入力..."
                rows={3}
              />

              {/* v3: 期限日設定 */}
              <div className="step-deadline-section">
                <label className={`step-deadline-label ${isOverdue ? 'overdue' : ''}`}>
                  {isOverdue
                    ? <AlertCircle size={11} color="#ef4444" />
                    : <Calendar size={11} />
                  }
                  <span>{isOverdue ? '期限切れ' : '期限'}</span>
                  <input
                    type="date"
                    className="step-deadline-input"
                    value={step.deadline ?? ''}
                    onChange={e => onUpdateStep(step.id, { deadline: e.target.value || undefined })}
                    onFocus={() => setIsDraggable(false)}
                  />
                </label>
              </div>

              <div className="step-notes-section">
                <div className="step-notes-header">
                  <FileText size={12} />
                  <span>作成意図・振り返りメモ</span>
                </div>
                <textarea
                  className="step-notes-textarea"
                  value={step.notes}
                  onChange={e => handleNotesChange(step.id, e.target.value)}
                  placeholder="なぜこの順序で計画したか、実行時にどんな気づきがあったかなどをメモしておけます..."
                  onFocus={() => setIsDraggable(false)}
                />
              </div>

              {/* v6: フリーズ解消ボタン（完了ステップとマイクロタスク自身には非表示） */}
              {!isMicro && step.status !== 'done' && (
                <button
                  className={`freeze-btn ${isFreezing ? 'loading' : ''}`}
                  onClick={() => onFreezeBreak(step.id)}
                  disabled={isFreezing || freezingStepId !== null}
                  title="このステップで手が止まったときに押す"
                >
                  {isFreezing
                    ? <><Loader2 size={12} className="spin" /> 分解中...</>
                    : <><Zap size={12} /> 止まった！小さく分解する</>
                  }
                </button>
              )}
            </div>
          );
        })}

        <button className="add-step-btn" onClick={() => onAddStep()}>
          <Plus size={16} />
          ステップを追加
        </button>
      </div>
    </div>
  );
};
