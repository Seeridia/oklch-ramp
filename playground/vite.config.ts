import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@okramp/tdesign': decodeURIComponent(
        new URL('../packages/tdesign/src/index.ts', import.meta.url).pathname,
      ),
      '@okramp/antd': decodeURIComponent(
        new URL('../packages/antd/src/index.ts', import.meta.url).pathname,
      ),
      '@okramp/shadcn': decodeURIComponent(
        new URL('../packages/shadcn/src/index.ts', import.meta.url).pathname,
      ),
      '@okramp/core': decodeURIComponent(new URL('../src/index.ts', import.meta.url).pathname),
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
