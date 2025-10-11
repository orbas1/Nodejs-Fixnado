import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      include: [
        'src/services/bookingService.js',
        'src/services/featureToggleService.js',
        'src/services/financeService.js',
        'src/services/zoneService.js',
        'src/routes/**/*.js',
        'src/middleware/**/*.js'
      ],
      exclude: [
        'src/routes/index.js'
      ],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 80,
        branches: 48
      }
    }
  }
});
