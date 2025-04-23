const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './generated-tests', // Ensure this points to the directory containing your test files
  timeout: 30000,
  retries: 1,
  reporter: 'html',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
});