import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://192.88.1.122:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1366,
    viewportHeight: 768,
  },
  env: {
    apiUrl: process.env.CYPRESS_API_URL || '**/api/v1',
  },
});
