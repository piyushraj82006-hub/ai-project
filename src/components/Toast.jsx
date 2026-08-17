import { useState, useEffect } from 'react';
import { getToasts, subscribeToasts, dismissToast } from '../lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState(getToasts);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  const typeStyles = {
    success: { bg: 'rgba(74, 222, 128, 0.15)', border: '#4ADE80', icon: '✓' },
    error: { bg: 'rgba(248, 113, 113, 0.15)', border: '#F87171', icon: '✕' },
    info: { bg: 'rgba(108, 99, 255, 0.15)', border: '#6C63FF', icon: 'ℹ' },
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px',
    }}>
      {toasts.map(t => {
        const s = typeStyles[t.type] || typeStyles.info;
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              animation: 'slideIn 0.3s ease-out',
              backdropFilter: 'blur(12px)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: s.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0A0A0F',
              flexShrink: 0,
            }}>
              {s.icon}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
