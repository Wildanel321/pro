import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb, db, generateId, generateSlug } from './db.js';
import { hashPassword } from './auth.js';
import authRouter, { defaultHtml, defaultCss, defaultJs } from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import filesRouter from './routes/files.js';
import publicRouter from './routes/public.js';

export function createApp() {
  initDb();
  seedInitialData();

  const app = express();

  app.use(
    cors({
      origin: true, // Allow frontend dev server and same-origin
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects/:projectId/files', filesRouter);
  app.use('/api/public', publicRouter);

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

// Seed demo showcase project if database has no public projects
export function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const demoUserId = generateId();
    const now = new Date().toISOString();
    const passwordHash = hashPassword('developer123');

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(demoUserId, 'codeforge_demo', 'demo@codeforge.dev', passwordHash, now, now);

    // Seed Demo Showcase Project: Particle Galaxy
    const projectId = generateId();
    const shareSlug = 'particle-galaxy';

    const particleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Particle Galaxy Simulation</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="hud">
    <h1>Particle Galaxy</h1>
    <p>Move mouse to attract particles. Click to burst.</p>
    <div class="stats">
      <span>Particles: <b id="p-count">120</b></span>
      <span>FPS: <b id="fps">60</b></span>
    </div>
  </div>
  <canvas id="canvas"></canvas>
  <script src="script.js"></script>
</body>
</html>`;

    const particleCss = `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #050811;
  color: #fff;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
}
.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  pointer-events: none;
  background: rgba(15, 23, 42, 0.75);
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}
h1 { font-size: 18px; font-weight: 600; color: #38bdf8; margin-bottom: 4px; }
p { font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
.stats { display: flex; gap: 16px; font-size: 12px; color: #cbd5e1; }
b { color: #34d399; }
canvas { display: block; width: 100vw; height: 100vh; }`;

    const particleJs = `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pCountEl = document.getElementById('p-count');
const fpsEl = document.getElementById('fps');

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const particles = [];
const TOTAL = 120;
const mouse = { x: width / 2, y: height / 2, down: false };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => {
  mouse.down = true;
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(mouse.x, mouse.y, true));
  }
  pCountEl.textContent = particles.length;
});

window.addEventListener('mouseup', () => { mouse.down = false; });

class Particle {
  constructor(x, y, burst = false) {
    this.x = x ?? Math.random() * width;
    this.y = y ?? Math.random() * height;
    const angle = Math.random() * Math.PI * 2;
    const speed = burst ? Math.random() * 8 + 3 : Math.random() * 2 + 0.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 2 + 1.5;
    this.color = burst ? '#f43f5e' : (Math.random() > 0.5 ? '#38bdf8' : '#818cf8');
    this.life = burst ? 80 : Infinity;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.life !== Infinity) this.life--;

    // Bounce off walls
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    // Attract to mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200 && dist > 10) {
      this.vx += (dx / dist) * 0.15;
      this.vy += (dy / dist) * 0.15;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

for (let i = 0; i < TOTAL; i++) {
  particles.push(new Particle());
}

let lastTime = performance.now();
let frames = 0;

function loop(currentTime) {
  ctx.fillStyle = 'rgba(5, 8, 17, 0.2)';
  ctx.fillRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.life <= 0) {
      particles.splice(i, 1);
      pCountEl.textContent = particles.length;
    }
  }

  // Connect lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        ctx.beginPath();
        ctx.strokeStyle = \`rgba(56, 189, 248, \${(1 - dist / 80) * 0.25})\`;
        ctx.lineWidth = 1;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  frames++;
  if (currentTime - lastTime >= 1000) {
    fpsEl.textContent = frames;
    frames = 0;
    lastTime = currentTime;
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
console.log("Particle Galaxy initialized with", TOTAL, "particles.");
`;

    db.prepare(`
      INSERT INTO projects (id, user_id, title, description, visibility, share_slug, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, demoUserId, 'Particle Galaxy Simulation', 'Realtime interactive canvas simulation with mouse physics and particle bursts.', 'public', shareSlug, now, now);

    const fStmt = db.prepare(`
      INSERT INTO project_files (id, project_id, name, content, file_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    fStmt.run(generateId(), projectId, 'index.html', particleHtml, 'html', now, now);
    fStmt.run(generateId(), projectId, 'style.css', particleCss, 'css', now, now);
    fStmt.run(generateId(), projectId, 'script.js', particleJs, 'javascript', now, now);
  }
}
