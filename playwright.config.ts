import { defineConfig, devices } from '@playwright/test'

const edge = {
  ...devices['Desktop Edge'],
  channel: 'msedge' as const,
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  webServer: {
    // Calling Vite directly lets Playwright terminate the child cleanly on Windows.
    command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'edge-1024', use: { ...edge, viewport: { width: 1024, height: 700 } } },
    { name: 'edge-1440', use: { ...edge, viewport: { width: 1440, height: 900 } } },
    { name: 'edge-1920', use: { ...edge, viewport: { width: 1920, height: 1080 } } },
  ],
})
