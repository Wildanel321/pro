import { Router, Response } from 'express';
import { z } from 'zod';
import { db, generateId, generateSlug } from '../db.js';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../auth.js';
import { defaultHtml, defaultCss, defaultJs } from './auth.js';

const router = Router();

const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100),
  description: z.string().max(500).optional().default(''),
  visibility: z.enum(['private', 'unlisted', 'public']).optional().default('private'),
  template: z.enum(['blank', 'default', 'counter']).optional().default('default'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).optional(),
});

const batchSaveSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  files: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      content: z.string(),
      file_type: z.enum(['html', 'css', 'javascript', 'json', 'text']),
    })
  ),
});

// Helper to determine file_type from filename
export function getFileType(name: string): 'html' | 'css' | 'javascript' | 'json' | 'text' {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'json':
      return 'json';
    default:
      return 'text';
  }
}

// List user's projects
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = db
      .prepare(`
        SELECT p.id, p.title, p.description, p.visibility, p.share_slug, p.created_at, p.updated_at,
               COUNT(f.id) as file_count
        FROM projects p
        LEFT JOIN project_files f ON p.id = f.project_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `)
      .all(req.user!.id);

    return res.json({ projects });
  } catch (error: any) {
    console.error('List projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = createProjectSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues.map((i) => i.message).join(', ') });
    }

    const { title, description, visibility } = parse.data;
    const projectId = generateId();
    const shareSlug = generateSlug();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, user_id, title, description, visibility, share_slug, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, req.user!.id, title, description, visibility, shareSlug, now, now);

    const fileInsert = db.prepare(`
      INSERT INTO project_files (id, project_id, name, content, file_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    fileInsert.run(generateId(), projectId, 'index.html', defaultHtml, 'html', now, now);
    fileInsert.run(generateId(), projectId, 'style.css', defaultCss, 'css', now, now);
    fileInsert.run(generateId(), projectId, 'script.js', defaultJs, 'javascript', now, now);

    const createdProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const files = db.prepare('SELECT * FROM project_files WHERE project_id = ? ORDER BY name ASC').all(projectId);

    return res.status(201).json({ project: createdProject, files });
  } catch (error: any) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db
      .prepare(`
        SELECT p.*, u.username as owner_username
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `)
      .get(id) as any;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = req.user && req.user.id === project.user_id;

    // Check visibility permissions
    if (project.visibility === 'private' && !isOwner) {
      return res.status(403).json({ error: 'This project is private' });
    }

    const files = db.prepare('SELECT * FROM project_files WHERE project_id = ? ORDER BY name ASC').all(id);

    return res.json({
      project,
      files,
      isOwner: !!isOwner,
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project metadata
router.patch('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to modify this project' });
    }

    const parse = updateProjectSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues.map((i) => i.message).join(', ') });
    }

    const title = parse.data.title ?? project.title;
    const description = parse.data.description ?? project.description;
    const visibility = parse.data.visibility ?? project.visibility;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE projects
      SET title = ?, description = ?, visibility = ?, updated_at = ?
      WHERE id = ?
    `).run(title, description, visibility, now, id);

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return res.json({ project: updated });
  } catch (error: any) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this project' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    return res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Duplicate project
router.post('/:id/duplicate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const original = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!original) {
      return res.status(404).json({ error: 'Original project not found' });
    }

    // Must be owner or original must be public/unlisted
    const isOwner = original.user_id === req.user!.id;
    if (original.visibility === 'private' && !isOwner) {
      return res.status(403).json({ error: 'Cannot duplicate private project' });
    }

    const newProjectId = generateId();
    const shareSlug = generateSlug();
    const now = new Date().toISOString();
    const newTitle = isOwner ? `${original.title} (Copy)` : `${original.title} (Fork)`;

    const origFiles = db.prepare('SELECT * FROM project_files WHERE project_id = ?').all(id) as any[];

    const insertTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO projects (id, user_id, title, description, visibility, share_slug, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newProjectId, req.user!.id, newTitle, original.description, 'private', shareSlug, now, now);

      const fileStmt = db.prepare(`
        INSERT INTO project_files (id, project_id, name, content, file_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const f of origFiles) {
        fileStmt.run(generateId(), newProjectId, f.name, f.content, f.file_type, now, now);
      }
    });

    insertTx();

    const duplicatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(newProjectId);
    const duplicatedFiles = db.prepare('SELECT * FROM project_files WHERE project_id = ? ORDER BY name ASC').all(newProjectId);

    return res.status(201).json({ project: duplicatedProject, files: duplicatedFiles });
  } catch (error: any) {
    console.error('Duplicate project error:', error);
    return res.status(500).json({ error: 'Failed to duplicate project' });
  }
});

// Batch save files & project metadata (Used for Save & Autosave)
router.put('/:id/batch-save', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to modify this project' });
    }

    const parse = batchSaveSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues.map((i) => i.message).join(', ') });
    }

    const { title, files } = parse.data;
    const now = new Date().toISOString();

    const saveTx = db.transaction(() => {
      if (title && title !== project.title) {
        db.prepare('UPDATE projects SET title = ?, updated_at = ? WHERE id = ?').run(title, now, id);
      } else {
        db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, id);
      }

      // Upsert files
      const updateStmt = db.prepare(`
        UPDATE project_files
        SET content = ?, file_type = ?, updated_at = ?
        WHERE project_id = ? AND name = ?
      `);

      const insertStmt = db.prepare(`
        INSERT INTO project_files (id, project_id, name, content, file_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const f of files) {
        const fileType = f.file_type || getFileType(f.name);
        const result = updateStmt.run(f.content, fileType, now, id, f.name);
        if (result.changes === 0) {
          insertStmt.run(f.id || generateId(), id, f.name, f.content, fileType, now, now);
        }
      }

      // Record snapshot in project_versions
      const latestVer = db
        .prepare('SELECT MAX(version_num) as max_v FROM project_versions WHERE project_id = ?')
        .get(id) as { max_v: number | null };
      const nextVer = (latestVer?.max_v || 0) + 1;

      db.prepare(`
        INSERT INTO project_versions (id, project_id, version_num, snapshot_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(generateId(), id, nextVer, JSON.stringify(files), now);
    });

    saveTx();

    const updatedFiles = db.prepare('SELECT * FROM project_files WHERE project_id = ? ORDER BY name ASC').all(id);
    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    return res.json({
      message: 'Project and files saved successfully',
      project: updatedProject,
      files: updatedFiles,
    });
  } catch (error: any) {
    console.error('Batch save error:', error);
    return res.status(500).json({ error: 'Failed to save project' });
  }
});

export default router;
