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
    deps: {
      optimizer: {
        ssr: {
          include: ['dotenv']
        }
      }
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov']
    },
    setupFiles: ['./vitest.setup.js']
  }
});
