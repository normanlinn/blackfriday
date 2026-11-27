'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, LogIn, Mail, Sparkles, UserPlus, X } from 'lucide-react';
import { useModalBehavior } from '@/lib/hooks';
import {
  loginWithGoogleProfile,
  loginWithPassword,
  registerUser,
  type AuthSessionResponse,
} from '@/lib/apiClient';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (session: AuthSessionResponse) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            options: { theme?: string; size?: string; width?: number },
          ) => void;
        };
      };
    };
  }
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  useModalBehavior(open, onClose);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [showGoogleQuick, setShowGoogleQuick] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!open || !googleClientId) return;
    const scriptId = 'google-gsi-script';
    const initGsi = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) return;
            setLoading(true);
            setError(null);
            const res = await loginWithGoogleProfile({ idToken: response.credential });
            setLoading(false);
            if (res.ok && res.session) {
              onAuthenticated(res.session);
              onClose();
            } else {
              setError(res.error || 'Google sign-in failed.');
            }
          },
        });
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
        });
      }
    };

    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = initGsi;
      document.head.appendChild(s);
    } else {
      initGsi();
    }
  }, [open, googleClientId, onAuthenticated, onClose]);

  if (!open) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res =
      mode === 'register'
        ? await registerUser(email, password, displayName)
        : await loginWithPassword(email, password);

    setLoading(false);
    if (res.ok && res.session) {
      onAuthenticated(res.session);
      onClose();
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleQuickGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await loginWithGoogleProfile({
      email: googleEmail,
      displayName: googleName,
    });
    setLoading(false);
    if (res.ok && res.session) {
      onAuthenticated(res.session);
      onClose();
    } else {
      setError(res.error || 'Google sign-in failed.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel modal-panel-sm modal-animate"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">Account &amp; Saved Lists</span>
            <h2 id="auth-modal-title" className="modal-title-sm">
              {mode === 'login' ? 'Sign In to Keep Your Lists' : 'Create Your Shopper Account'}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`filter-chip ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            className={`filter-chip ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            <UserPlus size={14} /> Create Account
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        {/* Google Sign-In Section */}
        <div className="google-auth-box">
          {googleClientId ? (
            <div ref={googleBtnRef} className="google-gsi-slot" />
          ) : (
            <>
              <button
                type="button"
                className="btn-google-oauth"
                onClick={() => setShowGoogleQuick((prev) => !prev)}
                disabled={loading}
              >
                <span className="google-g-badge">G</span>
                <span>Continue with Google</span>
              </button>

              {showGoogleQuick && (
                <form className="google-quick-form" onSubmit={handleQuickGoogle}>
                  <p className="muted-hint">
                    Connect with your Google email to persist your personal lists &amp; preferences in your backend account (add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> for live Google OAuth popup).
                  </p>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                  />
                  <button type="submit" className="btn-primary-gold" disabled={loading}>
                    <Sparkles size={14} /> {loading ? 'Signing in...' : 'Sign In with Google Email'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="auth-divider">
          <span>or with email &amp; password</span>
        </div>

        <form className="auth-form" onSubmit={handleEmailAuth}>
          {mode === 'register' && (
            <label className="field-group">
              <span>Your Name</span>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          )}

          <label className="field-group">
            <span>
              <Mail size={12} /> Email Address
            </span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>
              <Lock size={12} /> Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="btn-primary-gold w-full" disabled={loading}>
            {loading
              ? 'Authenticating...'
              : mode === 'login'
                ? 'Sign In & Load My Lists'
                : 'Create Account & Save Lists'}
          </button>
        </form>
      </div>
    </div>
  );
}
