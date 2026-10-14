import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Code2, ArrowLeft, Loader2, Globe, ExternalLink, Play } from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadExplore() {
      try {
        const res = await api.public.explore();
        setProjects(res.projects || []);
      } catch (err) {
        console.error('Failed to load explore projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExplore();
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.author_username && p.author_username.toLowerCase().includes(search.toLowerCase()))
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
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary)',
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
            placeholder="Search public projects..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              width: 200,
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Explore Public Projects</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Discover interactive applications, simulations, and creative playgrounds built by the community.
          </p>
        </div>

        {loading ? (
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
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No public projects found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/p/${proj.share_slug}`)}
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
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {proj.title}
                    </h3>
                    <span className="badge badge-public">Public</span>
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
                    {proj.description || 'Interactive web playground.'}
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
                  <span>by <b>{proj.author_username || 'Anonymous'}</b></span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/p/${proj.share_slug}`);
                    }}
                    className="btn btn-subtle"
                    style={{ height: 26, fontSize: 11 }}
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
