import { Router, Response } from 'express';
import { z } from 'zod';
import { db, generateId } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { getFileType } from './projects.js';

const router = Router({ mergeParams: true });

const createFileSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(80)
    .regex(/^[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+$/, 'Invalid file name format (e.g. app.js, styles.css)'),
  content: z.string().optional().default(''),
});

const updateFileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  content: z.string().optional(),
});

// Create file
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const parse = createFileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues.map((i) => i.message).join(', ') });
    }

    const { name, content } = parse.data;

    // Check duplicate name
    const existing = db
      .prepare('SELECT id FROM project_files WHERE project_id = ? AND name = ?')
      .get(projectId, name);
    if (existing) {
      return res.status(400).json({ error: `A file named '${name}' already exists in this project` });
    }

    const fileId = generateId();
    const fileType = getFileType(name);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO project_files (id, project_id, name, content, file_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, projectId, name, content, fileType, now, now);

    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    const created = db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId);
    return res.status(201).json({ file: created });
  } catch (error: any) {
    console.error('Create file error:', error);
    return res.status(500).json({ error: 'Failed to create file' });
  }
});

// Update or rename file
router.patch('/:fileId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, fileId } = req.params as { projectId: string; fileId: string };
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

    if (!project || project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const file = db.prepare('SELECT * FROM project_files WHERE id = ? AND project_id = ?').get(fileId, projectId) as any;
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parse = updateFileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues.map((i) => i.message).join(', ') });
    }

    const newName = parse.data.name ?? file.name;
    const newContent = parse.data.content !== undefined ? parse.data.content : file.content;
    const newType = getFileType(newName);
    const now = new Date().toISOString();

    if (newName !== file.name) {
      const duplicate = db
        .prepare('SELECT id FROM project_files WHERE project_id = ? AND name = ? AND id != ?')
        .get(projectId, newName, fileId);
      if (duplicate) {
        return res.status(400).json({ error: `A file named '${newName}' already exists` });
      }
    }

    db.prepare(`
      UPDATE project_files
      SET name = ?, content = ?, file_type = ?, updated_at = ?
      WHERE id = ?
    `).run(newName, newContent, newType, now, fileId);

    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    const updated = db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId);
    return res.json({ file: updated });
  } catch (error: any) {
    console.error('Update file error:', error);
    return res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete file
router.delete('/:fileId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, fileId } = req.params as { projectId: string; fileId: string };
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

    if (!project || project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const filesCount = db
      .prepare('SELECT COUNT(*) as count FROM project_files WHERE project_id = ?')
      .get(projectId) as { count: number };

    if (filesCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last file in the project' });
    }

    db.prepare('DELETE FROM project_files WHERE id = ? AND project_id = ?').run(fileId, projectId);

    const now = new Date().toISOString();
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    return res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Delete file error:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
