import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'oklch-ramp': decodeURIComponent(new URL('../src/index.ts', import.meta.url).pathname),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
