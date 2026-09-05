import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/claims',
  workers: 1,
  webServer: { command: 'npm run preview -- --port 4174', port: 4174, reuseExistingServer: false },
  use: { baseURL: 'http://127.0.0.1:4174', ...devices['Desktop Chrome'], trace: 'retain-on-failure' }
});
