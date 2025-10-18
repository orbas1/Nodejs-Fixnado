import { defineConfig, mergeConfig } from 'vite';
import path from 'node:path';
import baseConfig from './vite.config.js';

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      outDir: 'dist-analyze',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/analyzeMapEntry.jsx')
      }
    }
  })
);
