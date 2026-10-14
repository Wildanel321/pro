import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Project,
  ProjectFile,
  ConsoleLogItem,
  ViewportMode,
  FileType,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Navbar } from '../components/Navbar';
import { FileExplorer } from '../components/FileExplorer';
import { EditorTabs } from '../components/EditorTabs';
import { CodeEditor } from '../components/CodeEditor';
import { LivePreview } from '../components/LivePreview';
import { ConsolePanel } from '../components/ConsolePanel';
import { CommandPalette, CommandItem } from '../components/CommandPalette';
import { QuickFileModal } from '../components/QuickFileModal';
import { ShareModal } from '../components/ShareModal';
import { AuthModal } from '../components/AuthModal';
import {
  Play,
  Save,
  Plus,
  FolderTree,
  Terminal,
  Sun,
  Moon,
  Eye,
  AlignLeft,
  Copy,
  Share2,
  FileCode,
  LayoutGrid,
} from 'lucide-react';

const defaultStarterFiles: ProjectFile[] = [
  {
    name: 'index.html',
    file_type: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeForge Playground</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="card">
      <div class="badge">CodeForge Playground</div>
      <h1>Hello, World!</h1>
      <p>Edit HTML, CSS, and JS to see changes update in real time.</p>
      <div class="actions">
        <button id="counter-btn" class="btn">Clicked 0 times</button>
        <button id="test-log-btn" class="btn secondary">Test Console</button>
      </div>
      <div id="status" class="status-msg">Interactive runtime active</div>
    </div>
    <script src="script.js"></script>
  </body>
</html>`,
  },
  {
    name: 'style.css',
    file_type: 'css',
    content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #090d16;
  color: #f1f5f9;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 16px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #ffffff;
}

p {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn {
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn.secondary {
  background: #1f2937;
  color: #e2e8f0;
  border: 1px solid #374151;
}

.btn.secondary:hover {
  background: #374151;
}

.status-msg {
  font-size: 12px;
  color: #10b981;
  font-family: monospace;
}`,
  },
  {
    name: 'script.js',
    file_type: 'javascript',
    content: `// CodeForge Interactive Script
console.log("Welcome to CodeForge! Runtime initialized.");

let count = 0;
const counterBtn = document.getElementById("counter-btn");
const testLogBtn = document.getElementById("test-log-btn");
const statusDiv = document.getElementById("status");

if (counterBtn) {
  counterBtn.addEventListener("click", () => {
    count++;
    counterBtn.textContent = \`Clicked \${count} times\`;
    console.log(\`[Counter] Updated count to: \${count}\`);
  });
}

if (testLogBtn) {
  testLogBtn.addEventListener("click", () => {
    console.info("Testing console log levels:");
    console.warn("This is a sample warning message!");
    console.error("This is a sample error message (captured safely)");
    if (statusDiv) {
      statusDiv.textContent = "Console events dispatched at " + new Date().toLocaleTimeString();
    }
  });
}
`,
  },
];

export const IdePage: React.FC = () => {
  const { id: paramProjectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>(defaultStarterFiles);
  const [activeFileName, setActiveFileName] = useState<string>('index.html');
  const [openTabs, setOpenTabs] = useState<string[]>(['index.html', 'style.css', 'script.js']);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');

  // UI state
  const [showSidebar, setShowSidebar] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [autoReload, setAutoReload] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [formatTrigger, setFormatTrigger] = useState(0);
  const [runTrigger, setRunTrigger] = useState(1);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);

  // Modals
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickFile, setShowQuickFile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Layout resize
  const [splitRatio, setSplitRatio] = useState(50); // 50% editor, 50% preview
  const [consoleHeight, setConsoleHeight] = useState(200);
  const isDraggingSplit = useRef(false);
  const isDraggingConsole = useRef(false);

  // Autosave timer
  const autosaveTimeoutRef = useRef<any>(null);

  // Load project from API
  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      if (paramProjectId) {
        try {
          const res = await api.projects.get(paramProjectId);
          if (isMounted) {
            setProject(res.project);
            if (res.files && res.files.length > 0) {
              setFiles(res.files);
              const names = res.files.map((f) => f.name);
              setOpenTabs(names.slice(0, 4));
              setActiveFileName(names[0]);
            }
            setDirtyFiles(new Set());
            setSaveStatus('saved');
          }
        } catch (err) {
          console.error('Failed to load project:', err);
          // If not found or error, create fallback or redirect
        }
      } else if (user) {
        // Load user's latest project or create one
        try {
          const listRes = await api.projects.list();
          if (listRes.projects && listRes.projects.length > 0) {
            navigate(`/project/${listRes.projects[0].id}`, { replace: true });
          } else {
            const createRes = await api.projects.create({ title: 'My Playground' });
            navigate(`/project/${createRes.project.id}`, { replace: true });
          }
        } catch (err) {
          console.error('Failed to get user projects:', err);
        }
      } else {
        // Guest mode session with starter playground
        setProject({
          id: 'guest-project',
          title: 'CodeForge Playground',
          visibility: 'private',
          share_slug: 'guest-session',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    loadProject();
    return () => {
      isMounted = false;
    };
  }, [paramProjectId, user, navigate]);

  // Active file content
  const activeFile = files.find((f) => f.name === activeFileName) || files[0];

  // Update file content
  const handleContentChange = (newContent: string) => {
    if (!activeFile) return;

    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: newContent } : f))
    );

    setDirtyFiles((prev) => {
      const next = new Set(prev);
      next.add(activeFileName);
      return next;
    });

    setSaveStatus('dirty');

    // Trigger debounced autosave if user is logged in and not guest
    if (user && project && project.id !== 'guest-project') {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 1500);
    }

    // Auto reload preview if enabled (debounced 600ms)
    if (autoReload) {
      if ((window as any)._previewReloadTimer) clearTimeout((window as any)._previewReloadTimer);
      (window as any)._previewReloadTimer = setTimeout(() => {
        setRunTrigger((c) => c + 1);
      }, 600);
    }
  };

  // Save Project
  const handleSave = useCallback(async () => {
    if (!project) return;

    if (!user || project.id === 'guest-project') {
      setShowAuthModal(true);
      return;
    }

    setSaveStatus('saving');
    try {
      const res = await api.projects.batchSave(project.id, {
        title: project.title,
        files: files.map((f) => ({
          name: f.name,
          content: f.content,
          file_type: f.file_type,
        })),
      });

      setProject(res.project);
      setFiles(res.files);
      setDirtyFiles(new Set());
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  }, [project, user, files]);

  // Run Project
  const handleRun = useCallback(() => {
    setRunTrigger((c) => c + 1);
  }, []);

  // Update Project Title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!project) return;
    setProject((prev) => (prev ? { ...prev, title: newTitle } : null));

    if (user && project.id !== 'guest-project') {
      try {
        await api.projects.update(project.id, { title: newTitle });
      } catch (err) {
        console.error('Failed to update project title:', err);
      }
    }
  };

  // Update Project Visibility
  const handleUpdateVisibility = async (visibility: 'private' | 'unlisted' | 'public') => {
    if (!project) return;
    if (!user || project.id === 'guest-project') {
      setShowAuthModal(true);
      return;
    }

    const res = await api.projects.update(project.id, { visibility });
    setProject(res.project);
  };

  // Duplicate Project
  const handleDuplicate = async () => {
    if (!project) return;
    if (!user || project.id === 'guest-project') {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await api.projects.duplicate(project.id);
      navigate(`/project/${res.project.id}`);
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  };

  // File Operations
  const handleSelectFile = (fileName: string) => {
    setActiveFileName(fileName);
    if (!openTabs.includes(fileName)) {
      setOpenTabs((prev) => [...prev, fileName]);
    }
  };

  const handleCloseTab = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t !== fileName);
    if (remaining.length === 0) return;

    setOpenTabs(remaining);
    if (activeFileName === fileName) {
      setActiveFileName(remaining[remaining.length - 1]);
    }
  };

  const handleCreateFile = async (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    let fileType: FileType = 'text';
    if (ext === 'html' || ext === 'htm') fileType = 'html';
    else if (ext === 'css') fileType = 'css';
    else if (ext === 'js' || ext === 'mjs') fileType = 'javascript';
    else if (ext === 'json') fileType = 'json';

    const newFile: ProjectFile = {
      name,
      content: '',
      file_type: fileType,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabs((prev) => [...prev, name]);
    setActiveFileName(name);

    if (user && project && project.id !== 'guest-project') {
      try {
        await api.files.create(project.id, { name, content: '' });
      } catch (err) {
        console.error('Failed to create file on server:', err);
      }
    }
  };

  const handleRenameFile = async (oldName: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f))
    );

    setOpenTabs((prev) => prev.map((t) => (t === oldName ? newName : t)));

    if (activeFileName === oldName) {
      setActiveFileName(newName);
    }

    if (dirtyFiles.has(oldName)) {
      setDirtyFiles((prev) => {
        const next = new Set(prev);
        next.delete(oldName);
        next.add(newName);
        return next;
      });
    }

    const fileObj = files.find((f) => f.name === oldName);
    if (user && project && project.id !== 'guest-project' && fileObj?.id) {
      try {
        await api.files.update(project.id, fileObj.id, { name: newName });
      } catch (err) {
        console.error('Failed to rename file on server:', err);
      }
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    const fileObj = files.find((f) => f.name === fileName);
    const updatedFiles = files.filter((f) => f.name !== fileName);
    const updatedTabs = openTabs.filter((t) => t !== fileName);

    setFiles(updatedFiles);
    setOpenTabs(updatedTabs);

    if (activeFileName === fileName && updatedFiles.length > 0) {
      setActiveFileName(updatedFiles[0].name);
    }

    setDirtyFiles((prev) => {
      const next = new Set(prev);
      next.delete(fileName);
      return next;
    });

    if (user && project && project.id !== 'guest-project' && fileObj?.id) {
      try {
        await api.files.delete(project.id, fileObj.id);
      } catch (err) {
        console.error('Failed to delete file on server:', err);
      }
    }
  };

  // Console management
  const handleAddConsoleLog = useCallback((item: ConsoleLogItem) => {
    setLogs((prev) => [item, ...prev].slice(0, 200));
  }, []);

  const handleClearConsole = () => {
    setLogs([]);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if (isCmdOrCtrl && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setShowCommandPalette(true);
      } else if (isCmdOrCtrl && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setShowQuickFile(true);
      } else if (isCmdOrCtrl && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setShowSidebar((prev) => !prev);
      } else if (isCmdOrCtrl && e.key === '`') {
        e.preventDefault();
        setShowConsole((prev) => !prev);
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleRun]);

  // Resizing splitters
  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    isDraggingSplit.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleConsoleSplitterMouseDown = (e: React.MouseEvent) => {
    isDraggingConsole.current = true;
    document.body.style.cursor = 'row-resize';
  };

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDraggingSplit.current) {
        const totalWidth = window.innerWidth - (showSidebar ? 240 : 0);
        const mouseX = e.clientX - (showSidebar ? 240 : 0);
        const percentage = Math.max(20, Math.min(80, (mouseX / totalWidth) * 100));
        setSplitRatio(percentage);
      }

      if (isDraggingConsole.current) {
        const newHeight = Math.max(80, Math.min(window.innerHeight - 150, window.innerHeight - e.clientY));
        setConsoleHeight(newHeight);
      }
    }

    function handleMouseUp() {
      if (isDraggingSplit.current || isDraggingConsole.current) {
        isDraggingSplit.current = false;
        isDraggingConsole.current = false;
        document.body.style.cursor = '';
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showSidebar]);

  // Commands for palette
  const commands: CommandItem[] = [
    {
      id: 'run',
      label: 'Run Project',
      category: 'Build',
      shortcut: 'Ctrl+Enter',
      icon: <Play size={14} color="var(--accent-success)" />,
      action: handleRun,
    },
    {
      id: 'save',
      label: 'Save Project',
      category: 'File',
      shortcut: 'Ctrl+S',
      icon: <Save size={14} color="var(--accent-info)" />,
      action: handleSave,
    },
    {
      id: 'quick-file',
      label: 'Quick Open File...',
      category: 'Navigation',
      shortcut: 'Ctrl+P',
      icon: <FileCode size={14} />,
      action: () => setShowQuickFile(true),
    },
    {
      id: 'new-file',
      label: 'New File',
      category: 'File',
      icon: <Plus size={14} />,
      action: () => setShowSidebar(true),
    },
    {
      id: 'format',
      label: 'Format Document',
      category: 'Editor',
      shortcut: 'Shift+Alt+F',
      icon: <AlignLeft size={14} />,
      action: () => setFormatTrigger((c) => c + 1),
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle File Explorer',
      category: 'View',
      shortcut: 'Ctrl+B',
      icon: <FolderTree size={14} />,
      action: () => setShowSidebar((prev) => !prev),
    },
    {
      id: 'toggle-console',
      label: 'Toggle Console Panel',
      category: 'View',
      shortcut: 'Ctrl+`',
      icon: <Terminal size={14} />,
      action: () => setShowConsole((prev) => !prev),
    },
    {
      id: 'toggle-minimap',
      label: 'Toggle Code Minimap',
      category: 'View',
      icon: <Eye size={14} />,
      action: () => setShowMinimap((prev) => !prev),
    },
    {
      id: 'toggle-theme',
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      category: 'Preferences',
      icon: theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />,
      action: toggleTheme,
    },
    {
      id: 'share',
      label: 'Share Project Settings...',
      category: 'Project',
      icon: <Share2 size={14} />,
      action: () => setShowShareModal(true),
    },
    {
      id: 'duplicate',
      label: 'Duplicate Project',
      category: 'Project',
      icon: <Copy size={14} />,
      action: handleDuplicate,
    },
    {
      id: 'dashboard',
      label: 'Go to My Projects',
      category: 'Navigation',
      icon: <LayoutGrid size={14} />,
      action: () => navigate('/dashboard'),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Navbar */}
      <Navbar
        project={project}
        saveStatus={saveStatus}
        viewport={viewport}
        showSidebar={showSidebar}
        showConsole={showConsole}
        onSave={handleSave}
        onRun={handleRun}
        onUpdateTitle={handleUpdateTitle}
        onViewportChange={setViewport}
        onToggleSidebar={() => setShowSidebar((prev) => !prev)}
        onToggleConsole={() => setShowConsole((prev) => !prev)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onNavigateDashboard={() => navigate('/dashboard')}
      />

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left: File Explorer Sidebar */}
        {showSidebar && (
          <div style={{ width: 'var(--sidebar-width)', height: '100%', flexShrink: 0 }}>
            <FileExplorer
              files={files}
              activeFileName={activeFileName}
              dirtyFiles={dirtyFiles}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        )}

        {/* Center & Right: Split Work Area (Editor + Preview) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top: Editor & Preview Split Panels */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* Editor Container */}
            <div
              style={{
                width: `${splitRatio}%`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <EditorTabs
                files={files}
                activeFileName={activeFileName}
                openTabs={openTabs}
                dirtyFiles={dirtyFiles}
                showMinimap={showMinimap}
                onSelectTab={handleSelectFile}
                onCloseTab={handleCloseTab}
                onFormatDocument={() => setFormatTrigger((c) => c + 1)}
                onToggleMinimap={() => setShowMinimap((prev) => !prev)}
              />

              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {activeFile ? (
                  <CodeEditor
                    fileName={activeFile.name}
                    value={activeFile.content}
                    showMinimap={showMinimap}
                    onChange={handleContentChange}
                    onSave={handleSave}
                    onRun={handleRun}
                    formatTrigger={formatTrigger}
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    Select or create a file to start editing
                  </div>
                )}
              </div>
            </div>

            {/* Splitter Handle */}
            <div
              onMouseDown={handleSplitterMouseDown}
              style={{
                width: 5,
                height: '100%',
                cursor: 'col-resize',
                backgroundColor: 'var(--border-color)',
                zIndex: 20,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-focus)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
            />

            {/* Preview Container */}
            <div
              style={{
                width: `${100 - splitRatio}%`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <LivePreview
                files={files}
                viewport={viewport}
                autoReload={autoReload}
                onToggleAutoReload={() => setAutoReload((prev) => !prev)}
                onConsoleLog={handleAddConsoleLog}
                runTrigger={runTrigger}
              />
            </div>
          </div>

          {/* Bottom: Console Panel (Collapsible) */}
          {showConsole && (
            <>
              {/* Console Horizontal Resize Bar */}
              <div
                onMouseDown={handleConsoleSplitterMouseDown}
                style={{
                  height: 4,
                  width: '100%',
                  cursor: 'row-resize',
                  backgroundColor: 'var(--border-color)',
                  zIndex: 20,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-focus)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
              />

              <div style={{ height: consoleHeight, width: '100%', flexShrink: 0 }}>
                <ConsolePanel
                  logs={logs}
                  onClear={handleClearConsole}
                  onClose={() => setShowConsole(false)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      <QuickFileModal
        isOpen={showQuickFile}
        onClose={() => setShowQuickFile(false)}
        files={files}
        onSelectFile={handleSelectFile}
      />

      <ShareModal
        isOpen={showShareModal}
        project={project}
        onClose={() => setShowShareModal(false)}
        onUpdateVisibility={handleUpdateVisibility}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleSave}
      />
    </div>
  );
};
