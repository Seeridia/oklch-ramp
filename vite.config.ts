import { defineConfig } from 'vite-plus';

export default defineConfig({
  build: {
    outDir: 'preview-dist',
  },
  pack: {
    entry: ['src/index.ts'],
    dts: true,
    format: ['esm'],
    sourcemap: true,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
    },
  },
  lint: {
    ignorePatterns: ['dist/**', 'coverage/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    singleQuote: true,
  },
});
