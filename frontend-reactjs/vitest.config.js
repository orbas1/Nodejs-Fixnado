import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '@turf/bbox': resolve(__dirname, 'src/testStubs/turfBbox.js'),
      '@turf/helpers': resolve(__dirname, 'src/testStubs/turfHelpers.js')
    }
  },
  ssr: {
    noExternal: ['@turf/bbox', '@turf/helpers']
  }
});
