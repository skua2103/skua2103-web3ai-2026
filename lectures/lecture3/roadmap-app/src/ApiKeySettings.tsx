import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, X } from 'lucide-react';

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    onSave(apiKey.trim());
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    onSave('');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel animate-fade-in" style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Key size={20} color="#8b5cf6" />
            <h3 style={styles.title}>Gemini API 設定</h3>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div style={styles.body}>
          <p style={styles.description}>
            本物のAIを使用してオリジナルのロードマップを生成するには、Google AI Studio で取得した <strong>Gemini APIキー</strong> を入力してください。
          </p>
          <div style={styles.alertBox}>
            <strong>🔒 セキュリティについて:</strong>
            <p style={styles.alertText}>
              入力されたAPIキーはお使いのブラウザ（LocalStorage）にのみ直接保存され、外部のサーバーには一切送信されません。
            </p>
          </div>
          
          <div style={styles.inputWrapper}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={styles.eyeButton}
              title={showKey ? '非表示' : '表示'}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p style={styles.helpText}>
            ※キーが未設定の場合は、プリセットおよびルールベースの高品質なモック機能が自動で動作します。
          </p>
        </div>

        <div style={styles.footer}>
          <button style={styles.clearButton} onClick={handleClear}>
            クリア (モックモードへ)
          </button>
          <button style={styles.saveButton} onClick={handleSave}>
            <Save size={16} style={{ marginRight: '6px' }} />
            キーを保存して適用
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 16, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '480px',
    padding: '24px',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 25px rgba(139, 92, 246, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f3f4f6',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  body: {
    marginBottom: '24px',
  },
  description: {
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  alertBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderLeft: '3px solid #8b5cf6',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '20px',
    color: '#e5e7eb',
  },
  alertText: {
    marginTop: '4px',
    color: '#9ca3af',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 48px 12px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    transition: 'color 0.2s',
  },
  helpText: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '6px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  clearButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#9ca3af',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
  saveButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#8b5cf6',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
    transition: 'background-color 0.2s, transform 0.1s',
  },
};
