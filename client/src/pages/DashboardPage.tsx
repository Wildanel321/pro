import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Code2,
  Trash2,
  Copy,
  ExternalLink,
  Lock,
  Globe,
  EyeOff,
  Compass,
  ArrowLeft,
  Loader2,
  Share2,
} from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from '../components/AuthModal';
import { ShareModal } from '../components/ShareModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedShareProject, setSelectedShareProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.projects.list();
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const title = prompt('Enter a name for your new project:', 'New Playground');
    if (!title || !title.trim()) return;

    try {
      const res = await api.projects.create({ title: title.trim() });
      navigate(`/project/${res.project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDuplicate = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.projects.duplicate(project.id);
      fetchProjects();
      navigate(`/project/${res.project.id}`);
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const handleDelete = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete '${project.title}'? This cannot be undone.`)) {
      try {
        await api.projects.delete(project.id);
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  const handleUpdateVisibility = async (visibility: 'private' | 'unlisted' | 'public') => {
    if (!selectedShareProject) return;
    try {
      const res = await api.projects.update(selectedShareProject.id, { visibility });
      setSelectedShareProject(res.project);
      setProjects((prev) =>
        prev.map((p) => (p.id === res.project.id ? { ...p, visibility: res.project.visibility } : p))
      );
    } catch (err) {
      console.error('Failed to update visibility:', err);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
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
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <Code2 size={20} color="var(--accent-info)" />
            <span>CodeForge</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn btn-subtle"
            style={{ height: 28, fontSize: 12 }}
          >
            <ArrowLeft size={14} />
            <span>Open Playground</span>
          </button>

          <button
            onClick={() => navigate('/explore')}
            className="btn btn-subtle"
            style={{ height: 28, fontSize: 12 }}
          >
            <Compass size={14} />
            <span>Explore Community</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Logged in as <b>{user.username}</b>
              </span>
              <button onClick={logout} className="btn btn-subtle" style={{ height: 28, fontSize: 12 }}>
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary" style={{ height: 28 }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: '32px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>My Projects</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Create, organize, duplicate, and share your web playgrounds.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0 10px',
                height: 32,
                gap: 6,
              }}
            >
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  width: 160,
                }}
              />
            </div>

            <button onClick={handleCreateProject} className="btn btn-primary" style={{ height: 32 }}>
              <Plus size={15} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {!user ? (
          <div
            style={{
              padding: 40,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sign in to view your projects</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Create an account to save projects to the cloud, access them from anywhere, and share with others.
            </p>
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary">
              Sign In or Register
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-info)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No projects found</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {search ? 'Try modifying your search term' : 'Start your first web development project today'}
            </p>
            <button onClick={handleCreateProject} className="btn btn-primary">
              <Plus size={14} />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/project/${proj.id}`)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        marginRight: 8,
                      }}
                    >
                      {proj.title}
                    </h3>

                    <span className={`badge badge-${proj.visibility}`}>{proj.visibility}</span>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 16,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: 34,
                    }}
                  >
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 12,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>Updated {new Date(proj.updated_at).toLocaleDateString()}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShareProject(proj);
                      }}
                      title="Share Settings"
                      className="btn btn-subtle btn-icon"
                      style={{ width: 26, height: 26 }}
                    >
                      <Share2 size={13} />
                    </button>

                    <button
                      onClick={(e) => handleDuplicate(proj, e)}
                      title="Duplicate Project"
                      className="btn btn-subtle btn-icon"
                      style={{ width: 26, height: 26 }}
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(proj, e)}
                      title="Delete Project"
                      className="btn btn-subtle btn-icon"
                      style={{ width: 26, height: 26, color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={fetchProjects}
      />

      <ShareModal
        isOpen={!!selectedShareProject}
        project={selectedShareProject}
        onClose={() => setSelectedShareProject(null)}
        onUpdateVisibility={handleUpdateVisibility}
      />
    </div>
  );
};
