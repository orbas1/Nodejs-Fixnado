import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const shouldAnalyze = process.env.ANALYZE_BUNDLE === 'true';
const analyzeOutDir = process.env.ANALYZE_OUT_DIR || 'dist';

export default defineConfig({
  plugins: [
    react(),
    ...(shouldAnalyze
      ? [
          visualizer({
            filename: `${analyzeOutDir}/bundle-stats.html`,
            template: 'treemap',
            gzipSize: true,
            brotliSize: true
          }),
          visualizer({
            filename: `${analyzeOutDir}/bundle-stats.json`,
            template: 'raw-data'
          })
        ]
      : [])
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: shouldAnalyze,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/maplibre-gl')) {
            return 'maplibre';
          }
          if (id.includes('node_modules/terra-draw')) {
            return 'terra-draw';
          }
          return undefined;
        }
      }
    }
  }
});
