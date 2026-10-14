import React, { useState } from 'react';
import {
  FileCode2,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Code,
} from 'lucide-react';
import { ProjectFile } from '../types';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFileName: string;
  dirtyFiles: Set<string>;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (fileName: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileName,
  dirtyFiles,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFileName('');
    setErrorMsg(null);
  };

  const handleConfirmCreate = () => {
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }

    if (!trimmed.includes('.')) {
      setErrorMsg('File must have an extension (e.g. app.js)');
      return;
    }

    if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`File '${trimmed}' already exists`);
      return;
    }

    onCreateFile(trimmed);
    setIsCreating(false);
    setNewFileName('');
    setErrorMsg(null);
  };

  const handleStartRename = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileName(fileName);
    setRenameValue(fileName);
    setErrorMsg(null);
  };

  const handleConfirmRename = () => {
    if (!editingFileName) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === editingFileName) {
      setEditingFileName(null);
      return;
    }

    if (!trimmed.includes('.')) {
      setErrorMsg('File must have an extension');
      return;
    }

    if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase() && f.name !== editingFileName)) {
      setErrorMsg(`File '${trimmed}' already exists`);
      return;
    }

    onRenameFile(editingFileName, trimmed);
    setEditingFileName(null);
    setErrorMsg(null);
  };

  const handleDelete = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('Cannot delete the only file in the project.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete '${fileName}'?`)) {
      onDeleteFile(fileName);
    }
  };

  const renderFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 35,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
        }}
      >
        <span>Files ({files.length})</span>
        <button
          onClick={handleStartCreate}
          title="New File"
          className="btn btn-subtle btn-icon"
          style={{ width: 22, height: 22 }}
        >
          <Plus size={14} />
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '6px 10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--accent-danger)',
            fontSize: 11,
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {/* Creating new file input */}
        {isCreating && (
          <div
            style={{
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <Plus size={14} color="var(--accent-info)" />
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              placeholder="filename.ext"
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--border-focus)',
                color: 'var(--text-primary)',
                fontSize: 12,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleConfirmCreate}
              className="btn btn-subtle btn-icon"
              style={{ width: 20, height: 20, color: 'var(--accent-success)' }}
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="btn btn-subtle btn-icon"
              style={{ width: 20, height: 20, color: 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {files.map((file) => {
          const isActive = file.name === activeFileName;
          const isDirty = dirtyFiles.has(file.name);
          const isEditing = editingFileName === file.name;

          return (
            <div
              key={file.name}
              onClick={() => onSelectFile(file.name)}
              style={{
                height: 30,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-info)' : '2px solid transparent',
                fontSize: 13,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              className="file-item"
            >
              {isEditing ? (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderFileIcon(file.name)}
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') setEditingFileName(null);
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-focus)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      padding: '2px 4px',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleConfirmRename}
                    className="btn btn-subtle btn-icon"
                    style={{ width: 18, height: 18, color: 'var(--accent-success)' }}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditingFileName(null)}
                    className="btn btn-subtle btn-icon"
                    style={{ width: 18, height: 18, color: 'var(--text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    {renderFileIcon(file.name)}
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {file.name}
                    </span>
                    {isDirty && (
                      <span
                        title="Unsaved changes"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-warning)',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  {/* Actions on file hover */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                    className="file-actions"
                  >
                    <button
                      onClick={(e) => handleStartRename(file.name, e)}
                      title="Rename"
                      className="btn btn-subtle btn-icon"
                      style={{ width: 20, height: 20, padding: 0 }}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(file.name, e)}
                      title="Delete"
                      className="btn btn-subtle btn-icon"
                      style={{ width: 20, height: 20, padding: 0, color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
