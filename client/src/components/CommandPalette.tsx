import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Play, Save, Plus, FolderTree, Sun, Moon, Eye, AlignLeft, Copy, Share2 } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase();
    return cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 540,
          marginTop: '-15vh',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Search header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Search size={16} color="var(--accent-info)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESC to exit</span>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              No commands found for "{query}"
            </div>
          ) : (
            filtered.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-info)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{cmd.icon}</div>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{cmd.label}</span>
                  </div>

                  {cmd.shortcut && (
                    <kbd
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 3,
                        padding: '2px 6px',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
