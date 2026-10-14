import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'codeforge-prod-secret-key-998877665544332211';
const COOKIE_NAME = 'codeforge_token';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function authenticateUser(req: Request): AuthUser | null {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/, '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined;
    return user || null;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.user = authenticateUser(req) || undefined;
  next();
}
