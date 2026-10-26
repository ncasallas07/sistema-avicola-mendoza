// Pruebas de extremo a extremo (E2E) desde la interfaz, con Playwright.
// Requieren el backend y el frontend en ejecución, con los datos iniciales
// cargados (npm run db:seed). Ver e2e/README.md.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_URL || 'http://localhost:5173',
    headless: true,
    acceptDownloads: true,
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
  }
});
