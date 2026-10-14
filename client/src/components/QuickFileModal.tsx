import React, { useState, useEffect, useRef } from 'react';
import { Search, Code, FileSpreadsheet, FileCode2, FileText } from 'lucide-react';
import { ProjectFile } from '../types';

interface QuickFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (fileName: string) => void;
}

export const QuickFileModal: React.FC<QuickFileModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
}) => {
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

  const filtered = files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

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
        onSelectFile(filtered[selectedIndex].name);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <Code size={14} color="#f97316" />;
      case 'css':
        return <FileSpreadsheet size={14} color="#38bdf8" />;
      case 'js':
      case 'mjs':
        return <FileCode2 size={14} color="#eab308" />;
      case 'json':
        return <FileCode2 size={14} color="#10b981" />;
      default:
        return <FileText size={14} color="var(--text-muted)" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          marginTop: '-15vh',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
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
            placeholder="Type file name to open..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              No matching files found
            </div>
          ) : (
            filtered.map((file, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={file.name}
                  onClick={() => {
                    onSelectFile(file.name);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-info)' : '3px solid transparent',
                  }}
                >
                  {renderIcon(file.name)}
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {file.name}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
