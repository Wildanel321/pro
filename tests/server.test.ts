import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { db } from '../server/db.js';

const app = createApp();

describe('CodeForge API & Database Tests', () => {
  let authCookie: string;
  let userId: string;
  let testProjectId: string;
  let shareSlug: string;

  beforeAll(() => {
    // Database is initialized
    expect(db).toBeDefined();
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/register should create a user and default project', async () => {
    const unique = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `dev_${unique}`,
        email: `dev_${unique}@test.com`,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(`dev_${unique}`);
    expect(res.body.defaultProjectId).toBeDefined();
    userId = res.body.user.id;
    testProjectId = res.body.defaultProjectId;

    // Check auth cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    authCookie = cookies[0];
  });

  it('GET /api/auth/me should return authenticated user profile', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  it('GET /api/projects/:id should fetch project with initial files', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProjectId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.project.id).toBe(testProjectId);
    expect(res.body.files.length).toBe(3); // index.html, style.css, script.js
    shareSlug = res.body.project.share_slug;
  });

  it('POST /api/projects/:id/files should add a new file', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/files`)
      .set('Cookie', authCookie)
      .send({
        name: 'utils.js',
        content: 'export function add(a, b) { return a + b; }',
      });

    expect(res.status).toBe(201);
    expect(res.body.file.name).toBe('utils.js');
    expect(res.body.file.file_type).toBe('javascript');
  });

  it('PUT /api/projects/:id/batch-save should atomically update project files', async () => {
    const res = await request(app)
      .put(`/api/projects/${testProjectId}/batch-save`)
      .set('Cookie', authCookie)
      .send({
        title: 'Updated Test Playground',
        files: [
          { name: 'index.html', content: '<h1>Updated Content</h1>', file_type: 'html' },
          { name: 'style.css', content: 'body { color: red; }', file_type: 'css' },
          { name: 'script.js', content: 'console.log("Updated!");', file_type: 'javascript' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.project.title).toBe('Updated Test Playground');
    const htmlFile = res.body.files.find((f: any) => f.name === 'index.html');
    expect(htmlFile.content).toBe('<h1>Updated Content</h1>');
  });

  it('PATCH /api/projects/:id should change visibility to public', async () => {
    const res = await request(app)
      .patch(`/api/projects/${testProjectId}`)
      .set('Cookie', authCookie)
      .send({ visibility: 'public' });

    expect(res.status).toBe(200);
    expect(res.body.project.visibility).toBe('public');
  });

  it('GET /api/public/projects/:slug should allow unauthenticated access to public project', async () => {
    const res = await request(app).get(`/api/public/projects/${shareSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.project.title).toBe('Updated Test Playground');
    expect(res.body.files.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/projects/:id/duplicate should fork/duplicate a project', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/duplicate`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(201);
    expect(res.body.project.id).not.toBe(testProjectId);
    expect(res.body.project.title).toContain('(Copy)');
    expect(res.body.files.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/auth/logout should clear cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('codeforge_token=;');
  });
});
