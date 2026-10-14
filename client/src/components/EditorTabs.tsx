import React from 'react';
import { X, Code, FileSpreadsheet, FileCode2, FileText, AlignLeft, Eye } from 'lucide-react';
import { ProjectFile } from '../types';

interface EditorTabsProps {
  files: ProjectFile[];
  activeFileName: string;
  openTabs: string[];
  dirtyFiles: Set<string>;
  showMinimap: boolean;
  onSelectTab: (name: string) => void;
  onCloseTab: (name: string, e: React.MouseEvent) => void;
  onFormatDocument: () => void;
  onToggleMinimap: () => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  files,
  activeFileName,
  openTabs,
  dirtyFiles,
  showMinimap,
  onSelectTab,
  onCloseTab,
  onFormatDocument,
  onToggleMinimap,
}) => {
  const renderIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <Code size={13} color="#f97316" />;
      case 'css':
        return <FileSpreadsheet size={13} color="#38bdf8" />;
      case 'js':
      case 'mjs':
        return <FileCode2 size={13} color="#eab308" />;
      case 'json':
        return <FileCode2 size={13} color="#10b981" />;
      default:
        return <FileText size={13} color="var(--text-muted)" />;
    }
  };

  return (
    <div
      style={{
        height: 35,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', height: '100%', overflowX: 'auto', flex: 1 }}>
        {openTabs.map((fileName) => {
          const isActive = fileName === activeFileName;
          const isDirty = dirtyFiles.has(fileName);

          return (
            <div
              key={fileName}
              onClick={() => onSelectTab(fileName)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 12px',
                height: '100%',
                backgroundColor: isActive ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)',
                borderRight: '1px solid var(--border-color)',
                borderTop: isActive ? '2px solid var(--accent-info)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {renderIcon(fileName)}
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{fileName}</span>

              {isDirty ? (
                <span
                  title="Unsaved changes"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-warning)',
                    display: 'inline-block',
                    marginLeft: 2,
                  }}
                />
              ) : (
                <button
                  onClick={(e) => onCloseTab(fileName, e)}
                  title="Close Tab"
                  className="btn btn-subtle btn-icon"
                  style={{
                    width: 16,
                    height: 16,
                    padding: 0,
                    borderRadius: '50%',
                    marginLeft: 2,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor toolbar icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px' }}>
        <button
          onClick={onFormatDocument}
          title="Format Document (Shift+Alt+F)"
          className="btn btn-subtle btn-icon"
          style={{ width: 26, height: 26 }}
        >
          <AlignLeft size={14} />
        </button>

        <button
          onClick={onToggleMinimap}
          title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
          className="btn btn-subtle btn-icon"
          style={{
            width: 26,
            height: 26,
            color: showMinimap ? 'var(--accent-info)' : 'var(--text-muted)',
          }}
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
};
