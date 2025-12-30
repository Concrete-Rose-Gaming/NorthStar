import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for GitHub Pages compatibility
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@shared': '../shared/src',
      '@culinary-game/shared': '../shared/src/index.ts'
    }
  },
  optimizeDeps: {
    include: ['@culinary-game/shared'],
    esbuildOptions: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true
        }
      }
    }
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    assetsDir: 'assets',
    commonjsOptions: {
      include: [/shared/, /node_modules/]
    }
  }
});

