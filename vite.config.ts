import { defineConfig } from 'vite';

export default defineConfig({
  build: { target: 'es2022', sourcemap: true },
  server: { host: true },
  test: { exclude: ['tests/e2e/**', 'tests/claims/**', 'node_modules/**', 'dist/**'] }
});
