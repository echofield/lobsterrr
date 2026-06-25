import { defineConfig } from 'vite';

// Static single-page build. Camera (MediaPipe) needs a secure context:
// localhost is treated as secure, so `npm run dev` works without HTTPS.
export default defineConfig({
  server: { host: true, port: 5173 },
  build: { target: 'es2022' },
});
