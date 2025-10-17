import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = path.resolve(__dirname, 'src/dev/business-front');
const srcDir = path.resolve(__dirname, 'src');

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcDir
    }
  },
  server: {
    port: 5174,
    host: '0.0.0.0'
  },
  preview: {
    port: 5174,
    host: '0.0.0.0'
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-business-front'),
    emptyOutDir: true
  }
});
