import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Sparkles, Home, PenTool } from 'lucide-react';

export default function Header({ fileName, showNav = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '56px', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--bg-header)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <div className="header-logo">
          <Sparkles size={20} color="#fff" />
        </div>
        <h1 className="header-brand">Scroll.io</h1>
      </div>

      {/* Center: Nav links or file name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {showNav && (
          <>
            <NavBtn
              icon={<Home size={14} />}
              label="Dashboard"
              active={location.pathname === '/'}
              onClick={() => navigate('/')}
            />
            <NavBtn
              icon={<PenTool size={14} />}
              label="Summarize"
              active={location.pathname === '/summarize'}
              onClick={() => navigate('/summarize')}
            />
          </>
        )}
        {fileName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px',
          }}>
            <FileText size={14} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <span className="truncate">{fileName}</span>
          </div>
        )}
      </div>

      {/* Right side badge */}
      <span className="header-badge">AI Powered</span>
    </header>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: 'var(--radius-full)',
        background: active ? 'var(--accent-glow)' : 'transparent',
        border: active ? '1px solid rgba(212, 148, 10, 0.25)' : '1px solid transparent',
        color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
        fontSize: '12px', fontWeight: 500, cursor: 'pointer',
        transition: 'var(--transition-fast)',
      }}
    >
      {icon}{label}
    </button>
  );
}
