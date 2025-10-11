import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/providers/**/*.{js,jsx,ts,tsx}',
        'src/utils/telemetry.js',
        'src/theme/**/*.js'
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 85,
        branches: 50
      }
    }
  }
});
