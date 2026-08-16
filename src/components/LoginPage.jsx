import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../lib/firebase';
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

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

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={28} strokeWidth={1.5} />
          <span>Scroll.io</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue to your dashboard</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <Mail size={16} className="auth-field-icon" />
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="auth-field">
            <Lock size={16} className="auth-field-icon" />
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? <span className="spinner-sm" /> : <LogIn size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="auth-btn-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
