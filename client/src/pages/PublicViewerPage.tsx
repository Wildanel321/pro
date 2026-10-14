import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Code2,
  ExternalLink,
  Copy,
  Calendar,
  User as UserIcon,
  Play,
  RotateCw,
  Eye,
  Loader2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Project, ProjectFile } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CodeEditor } from '../components/CodeEditor';
import { compileProjectHtml } from '../utils/bundler';

export const PublicViewerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>('index.html');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');

  useEffect(() => {
    async function loadProject() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.public.getBySlug(slug);
        setProject(res.project);
        setFiles(res.files);
        if (res.files.length > 0) {
          setActiveFileName(res.files[0].name);
        }
      } catch (err: any) {
        setError(err.message || 'Project not found or is private.');
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [slug]);

  const activeFile = files.find((f) => f.name === activeFileName) || files[0];

  // Compile HTML for preview
  const compilePreview = () => {
    return compileProjectHtml(files);
  };

  const handleFork = async () => {
    if (!project) return;
    if (user) {
      try {
        const res = await api.projects.duplicate(project.id);
        navigate(`/project/${res.project.id}`);
      } catch (err) {
        console.error('Failed to fork project:', err);
      }
    } else {
      // Direct open in guest session
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-info)' }} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: 24,
        }}
      >
        <AlertCircle size={40} color="var(--accent-danger)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Unable to View Project</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          {error || 'This project may be private or has been removed.'}
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Back to Playground
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
          >
            <Code2 size={18} color="var(--accent-info)" />
            <span>CodeForge</span>
          </div>

          <span style={{ color: 'var(--border-subtle)' }}>/</span>

          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{project.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              by {project.author_username || 'Anonymous'} • Updated{' '}
              {new Date(project.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Center: View Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-primary)',
            padding: 2,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveView('preview')}
            className="btn btn-subtle"
            style={{
              height: 26,
              padding: '0 10px',
              backgroundColor: activeView === 'preview' ? 'var(--bg-hover)' : 'transparent',
              color: activeView === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>

          <button
            onClick={() => setActiveView('code')}
            className="btn btn-subtle"
            style={{
              height: 26,
              padding: '0 10px',
              backgroundColor: activeView === 'code' ? 'var(--bg-hover)' : 'transparent',
              color: activeView === 'code' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <FileCode size={13} />
            <span>Code ({files.length})</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleFork} className="btn btn-primary" style={{ height: 28, padding: '0 12px' }}>
            <Copy size={13} />
            <span>Fork in Playground</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeView === 'preview' ? (
          <iframe
            title="Public Project Preview"
            srcDoc={compilePreview()}
            sandbox="allow-scripts allow-modals"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff',
            }}
          />
        ) : (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* File List */}
            <div
              style={{
                width: 200,
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Project Files
              </div>
              {files.map((file) => (
                <div
                  key={file.name}
                  onClick={() => setActiveFileName(file.name)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    backgroundColor: file.name === activeFileName ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: file.name === activeFileName ? '2px solid var(--accent-info)' : '2px solid transparent',
                    color: file.name === activeFileName ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {file.name}
                </div>
              ))}
            </div>

            {/* Code View */}
            <div style={{ flex: 1, height: '100%' }}>
              {activeFile && (
                <CodeEditor
                  fileName={activeFile.name}
                  value={activeFile.content}
                  showMinimap={false}
                  onChange={() => {}}
                  onSave={() => {}}
                  onRun={() => {}}
                  formatTrigger={0}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
