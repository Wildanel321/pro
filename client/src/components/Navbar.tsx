import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Save,
  Share2,
  FolderTree,
  Terminal,
  Sun,
  Moon,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Loader2,
  AlertCircle,
  LayoutGrid,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Code2,
} from 'lucide-react';
import { Project, ViewportMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  project: Project | null;
  saveStatus: 'saved' | 'saving' | 'dirty' | 'error';
  viewport: ViewportMode;
  showSidebar: boolean;
  showConsole: boolean;
  onSave: () => void;
  onRun: () => void;
  onUpdateTitle: (title: string) => void;
  onViewportChange: (mode: ViewportMode) => void;
  onToggleSidebar: () => void;
  onToggleConsole: () => void;
  onOpenShareModal: () => void;
  onOpenAuthModal: () => void;
  onNavigateDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  saveStatus,
  viewport,
  showSidebar,
  showConsole,
  onSave,
  onRun,
  onUpdateTitle,
  onViewportChange,
  onToggleSidebar,
  onToggleConsole,
  onOpenShareModal,
  onOpenAuthModal,
  onNavigateDashboard,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      setTitleInput(project.title);
    }
  }, [project]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && project && titleInput.trim() !== project.title) {
      onUpdateTitle(titleInput.trim());
    } else if (project) {
      setTitleInput(project.title);
    }
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Left: Brand & Project Name */}
      <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onNavigateDashboard}
          title="Go to Projects Dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
          }}
          className="btn-subtle"
        >
          <Code2 size={18} color="var(--accent-info)" />
          <span>CodeForge</span>
        </button>

        <span style={{ color: 'var(--border-subtle)' }}>/</span>

        {/* Project Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setIsEditingTitle(false);
                if (project) setTitleInput(project.title);
              }
            }}
            autoFocus
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-focus)',
              color: 'var(--text-primary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              minWidth: 160,
            }}
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename project"
            style={{
              background: 'none',
              border: '1px solid transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              maxWidth: 220,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            className="btn-subtle"
          >
            {project?.title || 'Untitled Project'}
          </button>
        )}

        {/* Save Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Check size={13} />
              Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--accent-info)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              Saving...
            </span>
          )}
          {saveStatus === 'dirty' && (
            <span style={{ color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-warning)',
                  display: 'inline-block',
                }}
              />
              Unsaved
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertCircle size={13} />
              Save Failed
            </span>
          )}
        </div>
      </div>

      {/* Center: Controls (Run, Save, Viewport) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onRun}
          title="Run Code (Ctrl+Enter)"
          className="btn btn-primary"
          style={{ height: 28, padding: '0 10px' }}
        >
          <Play size={14} fill="currentColor" />
          <span>Run</span>
        </button>

        <button
          onClick={onSave}
          title="Save Project (Ctrl+S)"
          className="btn btn-secondary"
          style={{ height: 28, padding: '0 10px' }}
          disabled={saveStatus === 'saving'}
        >
          <Save size={14} />
          <span>Save</span>
        </button>

        <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        {/* Viewport switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary)',
            padding: 2,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => onViewportChange('desktop')}
            title="Desktop View (100%)"
            className="btn btn-subtle btn-icon"
            style={{
              width: 24,
              height: 24,
              backgroundColor: viewport === 'desktop' ? 'var(--bg-hover)' : 'transparent',
              color: viewport === 'desktop' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={() => onViewportChange('tablet')}
            title="Tablet View (768px)"
            className="btn btn-subtle btn-icon"
            style={{
              width: 24,
              height: 24,
              backgroundColor: viewport === 'tablet' ? 'var(--bg-hover)' : 'transparent',
              color: viewport === 'tablet' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Tablet size={13} />
          </button>
          <button
            onClick={() => onViewportChange('mobile')}
            title="Mobile View (375px)"
            className="btn btn-subtle btn-icon"
            style={{
              width: 24,
              height: 24,
              backgroundColor: viewport === 'mobile' ? 'var(--bg-hover)' : 'transparent',
              color: viewport === 'mobile' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Smartphone size={13} />
          </button>
        </div>
      </div>

      {/* Right: Panels, Share, Theme, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={onToggleSidebar}
          title="Toggle File Explorer (Ctrl+B)"
          className="btn btn-subtle btn-icon"
          style={{
            color: showSidebar ? 'var(--accent-info)' : 'var(--text-muted)',
          }}
        >
          <FolderTree size={16} />
        </button>

        <button
          onClick={onToggleConsole}
          title="Toggle Console (Ctrl+`)"
          className="btn btn-subtle btn-icon"
          style={{
            color: showConsole ? 'var(--accent-info)' : 'var(--text-muted)',
          }}
        >
          <Terminal size={16} />
        </button>

        <button
          onClick={onOpenShareModal}
          title="Share Project"
          className="btn btn-secondary"
          style={{ height: 28, padding: '0 10px' }}
        >
          <Share2 size={13} />
          <span>Share</span>
          {project?.visibility && (
            <span
              className={`badge badge-${project.visibility}`}
              style={{ fontSize: 9, padding: '1px 4px', textTransform: 'uppercase' }}
            >
              {project.visibility}
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="btn btn-subtle btn-icon"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Account / Login */}
        {user ? (
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="btn btn-subtle"
              style={{ height: 28, padding: '0 8px', gap: 4 }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </span>
              <ChevronDown size={12} />
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                  minWidth: 160,
                  padding: 4,
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigateDashboard();
                  }}
                  className="btn btn-subtle"
                  style={{ width: '100%', justifyContent: 'flex-start', height: 28, fontSize: 12 }}
                >
                  <LayoutGrid size={14} />
                  <span>My Projects</span>
                </button>

                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                  }}
                  className="btn btn-subtle"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    height: 28,
                    fontSize: 12,
                    color: 'var(--accent-danger)',
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="btn btn-primary"
            style={{ height: 28, padding: '0 10px' }}
          >
            <UserIcon size={13} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
