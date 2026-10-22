import { defineConfig, devices } from '@playwright/test';

const configuredPort = 4322;
const emptyPort = 4323;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    browserName: 'chromium',
    baseURL: `http://127.0.0.1:${configuredPort}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `node scripts/guestbook-test-server.mjs --mode=configured --port=${configuredPort}`,
      url: `http://127.0.0.1:${configuredPort}/guestbook/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `node scripts/guestbook-test-server.mjs --mode=empty --port=${emptyPort}`,
      url: `http://127.0.0.1:${emptyPort}/guestbook/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
