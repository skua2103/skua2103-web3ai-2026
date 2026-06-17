import React from 'react';
import { Plus, Trash2, Map, CheckCircle } from 'lucide-react';
import type { Roadmap } from './geminiService';
import './Sidebar.css';

interface SidebarProps {
  roadmaps: Roadmap[];
  activeRoadmapId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  roadmaps, activeRoadmapId, onSelect, onAdd, onDelete
}) => {
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <span className="sidebar-title">マイロードマップ</span>
        <button className="sidebar-add-btn" onClick={onAdd} title="新規ロードマップを作成">
          <Plus size={15} />
        </button>
      </div>

      <div className="sidebar-list">
        {roadmaps.length === 0 && (
          <div className="sidebar-empty">
            <Map size={22} color="rgba(139,92,246,0.4)" />
            <p>チャットで目標を入力するとロードマップが作成されます</p>
          </div>
        )}

        {roadmaps.map(rm => {
          const doneCount = rm.steps.filter(s => s.status === 'done').length;
          const total = rm.steps.length;
          const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
          const isActive = rm.id === activeRoadmapId;

          return (
            <div
              key={rm.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(rm.id)}
            >
              <div className="sidebar-item-content">
                <div className="sidebar-item-title">
                  {rm.title || '無題のロードマップ'}
                </div>
                {total > 0 ? (
                  <div className="sidebar-item-meta">
                    <CheckCircle size={10} />
                    <span>{doneCount}/{total}</span>
                    <div className="sidebar-progress-bar">
                      <div
                        className="sidebar-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="sidebar-percent">{progress}%</span>
                  </div>
                ) : (
                  <div className="sidebar-item-meta">
                    <span className="sidebar-empty-steps">ステップ未生成</span>
                  </div>
                )}
              </div>

              <button
                className="sidebar-delete-btn"
                onClick={e => { e.stopPropagation(); onDelete(rm.id); }}
                title="このロードマップを削除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
