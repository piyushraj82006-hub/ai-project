import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * TopNav - Shared navigation bar for all pages.
 *
 * Props:
 *   title      - Page title (string or ReactNode)
 *   showBack   - Show back arrow (default: false)
 *   onBack     - Custom back handler (default: navigate(-1))
 *   right      - ReactNode for right-side actions
 *   variant    - 'dashboard' | 'tool' (default: 'tool')
 *   transparent - No border/bg (for hero-style pages)
 */
export default function TopNav({
  title,
  showBack = false,
  onBack,
  right,
  variant = 'tool',
  transparent = false,
}) {
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));

  if (variant === 'dashboard') {
    return (
      <header className="topnav topnav-dashboard">
        <div className="topnav-brand">
          <Sparkles size={20} strokeWidth={1.5} />
          <span>{title || 'VIT Course Portal'}</span>
        </div>
        {right && <div className="topnav-right">{right}</div>}
      </header>
    );
  }

  return (
    <header className={`topnav ${transparent ? 'topnav-transparent' : ''}`}>
      <div className="topnav-left">
        {showBack && (
          <button className="topnav-back" onClick={handleBack} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
        )}
        {title && <span className="topnav-title">{title}</span>}
      </div>
      {right && <div className="topnav-right">{right}</div>}
    </header>
  );
}
