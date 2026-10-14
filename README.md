# CodeForge - Online Code Playground & Web IDE

**CodeForge** is a fast, full-featured, browser-based online development environment for HTML, CSS, and JavaScript. Built with real functionality from top to bottom—no mockups, no placeholders, and no slop.

---

## Key Features

### 1. Monaco Code Editor
- **Full IDE Capabilities**: Powered by Microsoft's Monaco Editor (the engine behind VS Code).
- **Multi-language Support**: Syntax highlighting, auto-completion, bracket pair colorization, line numbers, and error markers for HTML, CSS, JavaScript, and JSON.
- **Code Folding & Minimap**: Toggleable code minimap and code folding.
- **Keyboard Shortcuts**: `Ctrl+S` (Save), `Ctrl+Enter` (Run), `Shift+Alt+F` (Format Document), `Ctrl+F` (Search), `Ctrl+H` (Replace).

### 2. Multi-File Project File System
- Real file management panel: Create, Rename, Delete, Switch, and Edit files.
- Active file tabs with dirty-state indicator (bullet indicator on unsaved changes) and tab close buttons.
- Supports any file type (`.html`, `.css`, `.js`, `.json`, `.txt`).

### 3. Isolated Live Preview Engine
- **Sandboxed Security**: Executes user code in an isolated `iframe` with `sandbox="allow-scripts allow-modals"`. User code cannot access application cookies, localStorage, tokens, or the parent DOM.
- **Console & Error Bridge**: Intercepts `console.log`, `console.info`, `console.warn`, `console.error`, `window.onerror`, and unhandled promise rejections, streaming them directly into the CodeForge Console panel.
- **Responsive Viewport Modes**: Switch between Desktop (100%), Tablet (768px), and Mobile (375px) with one click.
- **Auto-Reload & Manual Run**: Configurable auto-reload debounced as you type, plus manual run control.

### 4. Interactive Console
- Displays log levels with distinct badges (Info, Log, Warning, Error).
- Filter by level (All, Logs, Warnings, Errors) or search through console messages.
- Real runtime error stack traces and clear console button.

### 5. Project Management & Cloud Persistence
- Real SQLite database with WAL mode and foreign key cascading.
- Save & debounced Autosave functionality.
- Rename projects, duplicate / fork projects, and delete with confirmation.
- Project dashboard (`/dashboard`) to manage and search your projects.

### 6. Authentication & Permissions
- Real user registration and login with bcrypt password hashing (10 salt rounds).
- HTTP-only JWT session cookies with secure same-site policies.
- Project visibility settings:
  - **Private**: Accessible only to the creator.
  - **Unlisted**: Accessible only via the secret share link (`/p/:slug`).
  - **Public**: Discoverable in Community Explore (`/explore`).

### 7. Developer Tool Usability
- **Command Palette (`Ctrl+Shift+P` / `F1`)**: Searchable action palette for running, saving, formatting, toggling panels, switching themes, etc.
- **Quick File Search (`Ctrl+P`)**: Jump between project files instantly.
- **Dark & Light Mode**: Technical, sleek developer interface with theme synchronization across editor, panels, and toolbars.

---

## Architecture & Technology Stack

```text
codeforge/
├── server/                     # Backend API & Database
│   ├── app.ts                  # Express application & routes setup
│   ├── index.ts                # Server runner (port 5000)
│   ├── db.ts                   # SQLite with Better-SQLite3 (WAL mode)
│   ├── auth.ts                 # JWT authentication & bcrypt password hashing
│   └── routes/                 # API routers (auth, projects, files, public)
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Monaco Editor, Preview, Console, File Explorer, Modals
│   │   ├── pages/              # IdePage, DashboardPage, ExplorePage, PublicViewerPage
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── services/           # Typed API client
│   │   └── index.css           # Design system tokens (Dark / Light)
├── tests/                      # Automated Test Suite (Vitest + Supertest)
```

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on Node.js 24)
- npm

### Installation & Setup

1. Install root and client dependencies:
   ```bash
   npm install
   npm --prefix client install
   ```

2. Run both the backend and frontend dev servers concurrently:
   ```bash
   npm run dev
   ```

3. Open your browser:
   - **Frontend Playground**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`

---

## Running Automated Tests

Run the test suite with Vitest:
```bash
npm test
```

All 10 unit and integration tests verify:
- Health check
- User registration and password hashing
- Session authentication and cookies
- Project retrieval and file initialization
- Dynamic file creation and editing
- Atomic batch saving and snapshotting
- Permission enforcement (private vs public vs unlisted)
- Project duplication / forking
- User logout
