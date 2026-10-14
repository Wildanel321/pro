import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, generateId, generateSlug } from '../db.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  AuthenticatedRequest,
} from '../auth.js';

const router = Router();

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

const defaultHtml = `<!DOCTYPE html>
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
</html>`;

const defaultCss = `* {
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
}`;

const defaultJs = `// CodeForge Interactive Script
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
`;

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues.map((i) => i.message).join(', '),
      });
    }

    const { username, email, password } = parseResult.data;

    // Check existing
    const existing = db
      .prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?')
      .get(username, email) as { id: string; username: string; email: string } | undefined;

    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const userId = generateId();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    // Insert user
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, username, email, passwordHash, now, now);

    // Create starter project for the new user
    const projectId = generateId();
    const shareSlug = generateSlug();
    db.prepare(`
      INSERT INTO projects (id, user_id, title, description, visibility, share_slug, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, userId, 'My First Playground', 'Starter project in CodeForge', 'private', shareSlug, now, now);

    // Insert default files
    const fileInsert = db.prepare(`
      INSERT INTO project_files (id, project_id, name, content, file_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    fileInsert.run(generateId(), projectId, 'index.html', defaultHtml, 'html', now, now);
    fileInsert.run(generateId(), projectId, 'style.css', defaultCss, 'css', now, now);
    fileInsert.run(generateId(), projectId, 'script.js', defaultJs, 'javascript', now, now);

    const userObj = { id: userId, username, email };
    const token = signToken(userObj);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: userObj,
      defaultProjectId: projectId,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues.map((i) => i.message).join(', '),
      });
    }

    const { identifier, password } = parseResult.data;

    const user = db
      .prepare('SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?')
      .get(identifier, identifier) as
      | { id: string; username: string; email: string; password_hash: string }
      | undefined;

    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const userObj = { id: user.id, username: user.username, email: user.email };
    const token = signToken(userObj);
    setAuthCookie(res, token);

    return res.json({
      user: userObj,
      message: 'Logged in successfully',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out successfully' });
});

// Current User Me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
export { defaultHtml, defaultCss, defaultJs };
