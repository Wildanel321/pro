import React, { useState } from 'react';
import { X, Copy, Check, Lock, Globe, EyeOff, ExternalLink } from 'lucide-react';
import { Project } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onUpdateVisibility: (visibility: 'private' | 'unlisted' | 'public') => Promise<void>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  project,
  onClose,
  onUpdateVisibility,
}) => {
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !project) return null;

  const shareUrl = `${window.location.origin}/p/${project.share_slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisibilityChange = async (visibility: 'private' | 'unlisted' | 'public') => {
    if (visibility === project.visibility) return;
    setUpdating(true);
    try {
      await onUpdateVisibility(visibility);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Share Project</h3>
          <button onClick={onClose} className="btn btn-subtle btn-icon" style={{ width: 24, height: 24 }}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Project Visibility
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Private */}
              <div
                onClick={() => handleVisibilityChange('private')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${project.visibility === 'private' ? 'var(--accent-info)' : 'var(--border-color)'}`,
                  backgroundColor: project.visibility === 'private' ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Lock size={16} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Private</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Only you can view and edit this project.</div>
                </div>
              </div>

              {/* Unlisted */}
              <div
                onClick={() => handleVisibilityChange('unlisted')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${project.visibility === 'unlisted' ? 'var(--accent-info)' : 'var(--border-color)'}`,
                  backgroundColor: project.visibility === 'unlisted' ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <EyeOff size={16} color="var(--accent-warning)" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Unlisted</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Anyone with the secret link can view this project.</div>
                </div>
              </div>

              {/* Public */}
              <div
                onClick={() => handleVisibilityChange('public')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${project.visibility === 'public' ? 'var(--accent-info)' : 'var(--border-color)'}`,
                  backgroundColor: project.visibility === 'public' ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Globe size={16} color="var(--accent-success)" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Public</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Visible to everyone in community explore and shared link.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Share Link */}
          {project.visibility !== 'private' ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Share Link
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="input-text"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '0 12px' }}>
                  {copied ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-subtle btn-icon"
                  title="Open share preview"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              To share this project, change visibility to Unlisted or Public above.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
