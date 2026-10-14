export interface User {
  id: string;
  username: string;
  email: string;
}

export type FileType = 'html' | 'css' | 'javascript' | 'json' | 'text';

export interface ProjectFile {
  id?: string;
  name: string;
  content: string;
  file_type: FileType;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  visibility: 'private' | 'unlisted' | 'public';
  share_slug: string;
  created_at: string;
  updated_at: string;
  owner_username?: string;
  author_username?: string;
  file_count?: number;
}

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleLogItem {
  id: string;
  level: LogLevel;
  args: any[];
  timestamp: string;
  stack?: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type Theme = 'dark' | 'light';
