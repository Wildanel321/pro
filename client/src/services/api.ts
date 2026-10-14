import { User, Project, ProjectFile } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || `Request failed with status ${res.status}`, res.status);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    me: () => request<{ user: User }>('/auth/me'),
    login: (body: { identifier: string; password: string }) =>
      request<{ user: User; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    register: (body: { username: string; email: string; password: string }) =>
      request<{ user: User; defaultProjectId: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },

  // Projects
  projects: {
    list: () => request<{ projects: Project[] }>('/projects'),
    get: (id: string) => request<{ project: Project; files: ProjectFile[]; isOwner: boolean }>(`/projects/${id}`),
    create: (body: { title: string; description?: string; visibility?: string }) =>
      request<{ project: Project; files: ProjectFile[] }>('/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { title?: string; description?: string; visibility?: string }) =>
      request<{ project: Project }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) =>
      request<{ project: Project; files: ProjectFile[] }>(`/projects/${id}/duplicate`, {
        method: 'POST',
      }),
    batchSave: (id: string, body: { title?: string; files: ProjectFile[] }) =>
      request<{ project: Project; files: ProjectFile[]; message: string }>(`/projects/${id}/batch-save`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
  },

  // Project Files
  files: {
    create: (projectId: string, body: { name: string; content?: string }) =>
      request<{ file: ProjectFile }>(`/projects/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (projectId: string, fileId: string, body: { name?: string; content?: string }) =>
      request<{ file: ProjectFile }>(`/projects/${projectId}/files/${fileId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (projectId: string, fileId: string) =>
      request<{ message: string }>(`/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      }),
  },

  // Public & Explore
  public: {
    explore: () => request<{ projects: Project[] }>('/public/explore'),
    getBySlug: (slug: string) =>
      request<{ project: Project; files: ProjectFile[] }>(`/public/projects/${slug}`),
  },
};
