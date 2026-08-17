import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Sparkles, Home, Upload, PenTool } from 'lucide-react';

export default function Header({ fileName, showNav = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--bg-header)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => navigate('/')}>
        <div style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px var(--accent-glow)',
        }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '20px',
          fontWeight: 700, letterSpacing: '-0.02em',
        }}>
          <span className="gradient-text">Scroll.io</span>
        </h1>
      </div>

      {/* Center: Nav links or file name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {showNav && (
          <>
            <NavBtn icon={<Home size={14} />} label="Dashboard" 
              active={location.pathname === '/'} onClick={() => navigate('/')} />
            <NavBtn icon={<PenTool size={14} />} label="Summarize" 
              active={location.pathname === '/summarize'} onClick={() => navigate('/summarize')} />
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
      }}>
        <span style={{
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          background: 'rgba(0, 122, 255, 0.1)',
          border: '1px solid rgba(0, 122, 255, 0.22)',
          color: 'var(--accent-light)', fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.2px',
        }}>
          AI Powered
        </span>
      </div>
    </header>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: 'var(--radius-full)',
      background: active ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
      border: active ? '1px solid rgba(0, 122, 255, 0.28)' : '1px solid transparent',
      color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
      fontSize: '12px', fontWeight: 500, cursor: 'pointer',
      transition: 'var(--transition-fast)',
    }}>
      {icon}{label}
    </button>
  );
}
