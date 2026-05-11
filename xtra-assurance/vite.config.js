import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const REPO = 'skills-build-applications-w-copilot-agent-mode';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${REPO}/` : '/',
  server: {
    port: 3000,
    host: true,
  },
});
