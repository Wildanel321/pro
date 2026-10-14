import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, Maximize2, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { ProjectFile, ViewportMode, ConsoleLogItem } from '../types';

import { compileProjectHtml } from '../utils/bundler';

interface LivePreviewProps {
  files: ProjectFile[];
  viewport: ViewportMode;
  autoReload: boolean;
  onToggleAutoReload: () => void;
  onConsoleLog: (item: ConsoleLogItem) => void;
  runTrigger: number;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  viewport,
  autoReload,
  onToggleAutoReload,
  onConsoleLog,
  runTrigger,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Compile bundled HTML document
  const compileDocument = useCallback((): string => {
    return compileProjectHtml(files);
  }, [files]);


  // Execute preview
  const executePreview = useCallback(() => {
    setLastError(null);
    if (!iframeRef.current) return;

    const html = compileDocument();
    iframeRef.current.srcdoc = html;
  }, [compileDocument]);

  // Handle messages from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'CODEFORGE_CONSOLE') {
        const item: ConsoleLogItem = {
          id: Math.random().toString(36).substring(2, 9),
          level: event.data.level,
          args: event.data.args,
          timestamp: event.data.timestamp,
          stack: event.data.stack,
        };
        onConsoleLog(item);
        if (item.level === 'error') {
          setLastError(item.args.join(' '));
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleLog]);

  // Trigger when run is pressed
  useEffect(() => {
    if (runTrigger > 0) {
      executePreview();
    }
  }, [runTrigger, executePreview]);

  // Initial load
  useEffect(() => {
    executePreview();
  }, []);

  // Viewport width styling
  const getViewportStyle = () => {
    switch (viewport) {
      case 'tablet':
        return {
          width: 768,
          height: '100%',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          borderLeft: '1px solid var(--border-color)',
          borderRight: '1px solid var(--border-color)',
        };
      case 'mobile':
        return {
          width: 375,
          height: '100%',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          borderLeft: '1px solid var(--border-color)',
          borderRight: '1px solid var(--border-color)',
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
        };
    }
  };

  const handleOpenFullscreen = () => {
    const html = compileDocument();
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Preview Sub-toolbar */}
      <div
        style={{
          height: 35,
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          fontSize: 12,
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
            Preview
          </span>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 11,
            }}
          >
            <input
              type="checkbox"
              checked={autoReload}
              onChange={onToggleAutoReload}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto Reload</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={executePreview}
            title="Reload Preview"
            className="btn btn-subtle btn-icon"
            style={{ width: 24, height: 24 }}
          >
            <RotateCw size={13} />
          </button>

          <button
            onClick={handleOpenFullscreen}
            title="Open in new window"
            className="btn btn-subtle btn-icon"
            style={{ width: 24, height: 24 }}
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {lastError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid var(--accent-danger)',
            color: 'var(--accent-danger)',
            padding: '6px 12px',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {lastError}
            </span>
          </div>
          <button
            onClick={() => setLastError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 11 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Frame Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: viewport === 'desktop' ? 'transparent' : 'var(--bg-tertiary)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <iframe
          ref={iframeRef}
          title="CodeForge Live Preview"
          sandbox="allow-scripts allow-modals"
          style={{
            ...getViewportStyle(),
            backgroundColor: '#ffffff',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
};
