import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[CodeForge Server] Listening on http://localhost:${PORT}`);
});
