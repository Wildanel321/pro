import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

// Explore public projects
router.get('/explore', (_req: Request, res: Response) => {
  try {
    const projects = db
      .prepare(`
        SELECT p.id, p.title, p.description, p.visibility, p.share_slug, p.created_at, p.updated_at,
               u.username as author_username,
               COUNT(f.id) as file_count
        FROM projects p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN project_files f ON p.id = f.project_id
        WHERE p.visibility = 'public'
        GROUP BY p.id
        ORDER BY p.updated_at DESC
        LIMIT 50
      `)
      .all();

    return res.json({ projects });
  } catch (error: any) {
    console.error('Explore projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch public projects' });
  }
});

// Get shared project by share_slug or id
router.get('/projects/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Search by share_slug or id
    const project = db
      .prepare(`
        SELECT p.id, p.title, p.description, p.visibility, p.share_slug, p.created_at, p.updated_at,
               u.username as author_username
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.share_slug = ? OR p.id = ?
      `)
      .get(slug, slug) as any;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.visibility === 'private') {
      return res.status(403).json({ error: 'This project is private and cannot be viewed publicly' });
    }

    const files = db
      .prepare('SELECT id, name, content, file_type FROM project_files WHERE project_id = ? ORDER BY name ASC')
      .all(project.id);

    return res.json({
      project,
      files,
    });
  } catch (error: any) {
    console.error('Get shared project error:', error);
    return res.status(500).json({ error: 'Failed to fetch shared project' });
  }
});

export default router;
