import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        if (!identifier.trim() || !password) {
          setError('Please enter your username/email and password');
          setSubmitting(false);
          return;
        }
        await login(identifier.trim(), password);
      } else {
        if (!username.trim() || !email.trim() || !password) {
          setError('All fields are required');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setSubmitting(false);
          return;
        }
        await register(username.trim(), email.trim(), password);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>{mode === 'login' ? 'Sign In to CodeForge' : 'Create an Account'}</h3>
          <button onClick={onClose} className="btn btn-subtle btn-icon" style={{ width: 24, height: 24 }}>
            <X size={14} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            style={{
              flex: 1,
              height: 36,
              background: 'none',
              border: 'none',
              borderBottom: mode === 'login' ? '2px solid var(--accent-info)' : '2px solid transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            style={{
              flex: 1,
              height: 36,
              background: 'none',
              border: 'none',
              borderBottom: mode === 'register' ? '2px solid var(--accent-info)' : '2px solid transparent',
              color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--accent-danger)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-danger)',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {mode === 'login' ? (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Username or Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. developer or dev@example.com"
                      className="input-text"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-text"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_coder"
                    className="input-text"
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="input-text"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Password (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-text"
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-subtle">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: 90 }}>
              {submitting ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
