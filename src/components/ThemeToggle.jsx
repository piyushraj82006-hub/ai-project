import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
        transition: 'var(--transition-base)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--accent-light)';
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{
        transition: 'transform 0.4s ease, opacity 0.3s ease',
        transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)',
        opacity: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </div>
    </button>
  );
}
