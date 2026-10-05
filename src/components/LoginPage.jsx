import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../lib/firebase';
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles, FileText, Brain, Video, CheckCircle } from 'lucide-react';

const features = [
  { icon: FileText, text: 'AI-powered PDF summarizer' },
  { icon: Brain, text: 'Smart flashcards & quizzes' },
  { icon: Video, text: 'Curated video tutorials' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later'
        : err.message || 'Login failed';
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally { setLoading(false); }
  };

  const panelRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const layers = panel.querySelectorAll('[data-mouse-speed]');
    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.mouseSpeed) || 1;
      const xOff = x * speed * 30;
      const yOff = y * speed * 30;
      layer.style.transform = `translate3d(${xOff}px, ${yOff}px, 0)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = panel.querySelectorAll('[data-mouse-speed]');
    layers.forEach(layer => {
      layer.style.transform = 'translate3d(0, 0, 0)';
    });
  }, []);

  return (
    <div className="auth-split-page">
      {/* Left — Branding */}
      <div className="auth-left" ref={panelRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className="auth-left-parallax" aria-hidden="true">
          <div className="auth-orb auth-orb-1" data-mouse-speed="1.5" />
          <div className="auth-orb auth-orb-2" data-mouse-speed="2" />
          <div className="auth-orb auth-orb-3" data-mouse-speed="1" />
          <div className="auth-grid-overlay" data-mouse-speed="0.5" />
        </div>
        <div className="auth-left-content">
          <div className="auth-brand anim-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="auth-brand-icon"><Sparkles size={24} /></div>
            <span className="auth-brand-name">Scroll<span className="gradient-text">.io</span></span>
          </div>

          <h1 className="auth-left-headline anim-fade-up" style={{ animationDelay: '0.25s' }}>
            Welcome<br />back.
          </h1>
          <p className="auth-left-subtext anim-fade-up" style={{ animationDelay: '0.4s' }}>
            Sign in to access your courses, AI tools, and study companion — all in one place.
          </p>

          <ul className="auth-features">
            {features.map((f, i) => (
              <li key={i} className="auth-feature-item anim-fade-up" style={{ animationDelay: `${0.55 + i * 0.1}s` }}>
                <div className="auth-feature-icon"><f.icon size={16} /></div>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="auth-left-footer anim-fade-up" style={{ animationDelay: '0.9s' }}>
            <CheckCircle size={14} />
            <span>Trusted by 2,000+ VIT students</span>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="auth-right">
        <div className="auth-card auth-card-split">
          <div className="auth-mobile-logo anim-fade-up" style={{ animationDelay: '0.15s' }}>
            <Sparkles size={22} strokeWidth={1.5} />
            <span>Scroll<span className="gradient-text">.io</span></span>
          </div>

          <h1 className="auth-title anim-fade-up" style={{ animationDelay: '0.2s' }}>Sign in</h1>
          <p className="auth-subtitle anim-fade-up" style={{ animationDelay: '0.3s' }}>Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field anim-fade-up" style={{ animationDelay: '0.35s' }}>
            <Mail size={16} className="auth-field-icon" />
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="auth-field anim-fade-up" style={{ animationDelay: '0.45s' }}>
            <Lock size={16} className="auth-field-icon" />
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="auth-btn-primary anim-fade-up" style={{ animationDelay: '0.55s' }} disabled={loading}>
            {loading ? <span className="spinner-sm" /> : <LogIn size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider anim-fade-up" style={{ animationDelay: '0.65s' }}><span>or</span></div>

        <button className="auth-btn-google anim-fade-up" style={{ animationDelay: '0.75s' }} onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

        <p className="auth-footer anim-fade-up" style={{ animationDelay: '0.85s' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
