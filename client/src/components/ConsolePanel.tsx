import React, { useState } from 'react';
import {
  Ban,
  Terminal,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { ConsoleLogItem, LogLevel } from '../types';

interface ConsolePanelProps {
  logs: ConsoleLogItem[];
  onClear: () => void;
  onClose: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear, onClose }) => {
  const [filter, setFilter] = useState<'all' | LogLevel>('all');
  const [search, setSearch] = useState('');

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const content = log.args.join(' ').toLowerCase();
      return content.includes(q);
    }
    return true;
  });

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle size={13} color="var(--accent-danger)" />;
      case 'warn':
        return <AlertTriangle size={13} color="var(--accent-warning)" />;
      case 'info':
        return <Info size={13} color="var(--accent-info)" />;
      default:
        return <ChevronRight size={13} color="var(--text-muted)" />;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      {/* Console Toolbar */}
      <div
        style={{
          height: 32,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>
            <Terminal size={13} />
            <span>CONSOLE</span>
          </div>

          <button
            onClick={onClear}
            title="Clear Console"
            className="btn btn-subtle btn-icon"
            style={{ width: 22, height: 22 }}
          >
            <Ban size={12} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
            <button
              onClick={() => setFilter('all')}
              className="btn btn-subtle"
              style={{
                height: 20,
                padding: '0 6px',
                fontSize: 11,
                backgroundColor: filter === 'all' ? 'var(--bg-hover)' : 'transparent',
                color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className="btn btn-subtle"
              style={{
                height: 20,
                padding: '0 6px',
                fontSize: 11,
                backgroundColor: filter === 'error' ? 'var(--bg-hover)' : 'transparent',
                color: errorCount > 0 ? 'var(--accent-danger)' : 'var(--text-muted)',
              }}
            >
              Errors ({errorCount})
            </button>
            <button
              onClick={() => setFilter('warn')}
              className="btn btn-subtle"
              style={{
                height: 20,
                padding: '0 6px',
                fontSize: 11,
                backgroundColor: filter === 'warn' ? 'var(--bg-hover)' : 'transparent',
                color: warnCount > 0 ? 'var(--accent-warning)' : 'var(--text-muted)',
              }}
            >
              Warnings ({warnCount})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Search filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              padding: '1px 6px',
              gap: 4,
            }}
          >
            <Search size={11} color="var(--text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter console..."
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none',
                width: 110,
              }}
            />
          </div>

          <button
            onClick={onClose}
            title="Close Console Panel"
            className="btn btn-subtle btn-icon"
            style={{ width: 22, height: 22 }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
            No logs captured. Output from console.log(), warnings, and runtime errors will stream here.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '4px 10px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor:
                  log.level === 'error'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : log.level === 'warn'
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'transparent',
                lineHeight: 1.5,
              }}
            >
              <div style={{ marginTop: 2 }}>{getLevelIcon(log.level)}</div>

              <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                {log.timestamp}
              </span>

              <div style={{ flex: 1, wordBreak: 'break-all' }}>
                <span
                  style={{
                    color:
                      log.level === 'error'
                        ? 'var(--accent-danger)'
                        : log.level === 'warn'
                        ? 'var(--accent-warning)'
                        : 'var(--text-primary)',
                  }}
                >
                  {log.args.join(' ')}
                </span>

                {log.stack && (
                  <pre
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {log.stack}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
