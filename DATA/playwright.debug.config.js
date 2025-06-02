import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  
  reporter: [['list']],
  
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3050',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  
  globalTimeout: 60000 * 5,
  timeout: 30000,
  
  expect: {
    timeout: 5000,
  },
}); 