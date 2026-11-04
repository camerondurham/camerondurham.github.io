import { defineConfig, devices } from '@playwright/test';

const servers = { configured: Number(process.env.GUESTBOOK_TEST_PORT || 4322), empty: Number(process.env.GUESTBOOK_EMPTY_TEST_PORT || 4323) };

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${servers.configured}`,
    trace: 'retain-on-failure',
  },
  webServer: Object.entries(servers).map(([mode, port]) => ({
    command: `node scripts/guestbook-test-server.mjs ${mode} ${port}`,
    url: `http://127.0.0.1:${port}/guestbook/`,
    timeout: 120_000,
  })),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
