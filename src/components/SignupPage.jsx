import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../lib/firebase';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Sparkles, FileText, Brain, Video, CheckCircle } from 'lucide-react';

const features = [
  { icon: FileText, text: 'AI-powered PDF summarizer' },
  { icon: Brain, text: 'Smart flashcards & quizzes' },
  { icon: Video, text: 'Curated video tutorials' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPw) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPw) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'An account with this email already exists'
        : err.code === 'auth/weak-password' ? 'Password is too weak (min 6 characters)'
        : err.code === 'auth/invalid-email' ? 'Invalid email address'
        : err.message || 'Signup failed';
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
            Start your<br />journey.
          </h1>
          <p className="auth-left-subtext anim-fade-up" style={{ animationDelay: '0.4s' }}>
            Create your account and unlock AI-powered study tools, course management, and more.
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
            <span>Free to use · No credit card required</span>
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

          <h1 className="auth-title anim-fade-up" style={{ animationDelay: '0.2s' }}>Create account</h1>
          <p className="auth-subtitle anim-fade-up" style={{ animationDelay: '0.3s' }}>Fill in your details to get started</p>

          {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field anim-fade-up" style={{ animationDelay: '0.35s' }}>
            <User size={16} className="auth-field-icon" />
            <input type="text" placeholder="Full name" value={name}
              onChange={e => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="auth-field anim-fade-up" style={{ animationDelay: '0.45s' }}>
            <Mail size={16} className="auth-field-icon" />
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="auth-field anim-fade-up" style={{ animationDelay: '0.55s' }}>
            <Lock size={16} className="auth-field-icon" />
            <input type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="auth-field anim-fade-up" style={{ animationDelay: '0.65s' }}>
            <Lock size={16} className="auth-field-icon" />
            <input type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
          </div>
          <button type="submit" className="auth-btn-primary anim-fade-up" style={{ animationDelay: '0.75s' }} disabled={loading}>
            {loading ? <span className="spinner-sm" /> : <UserPlus size={16} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider anim-fade-up" style={{ animationDelay: '0.85s' }}><span>or</span></div>

        <button className="auth-btn-google anim-fade-up" style={{ animationDelay: '0.95s' }} onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

        <p className="auth-footer anim-fade-up" style={{ animationDelay: '1.05s' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
