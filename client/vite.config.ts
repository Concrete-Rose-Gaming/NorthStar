import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get base path from environment variable or default to root
// For GitHub Pages: set to '/repository-name/' (with trailing slash)
// For custom domain: set to '/' or leave empty
// Using process.env is fine here as this runs at build time
const base = (process.env as any).VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
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
    commonjsOptions: {
      include: [/shared/, /node_modules/]
    }
  }
});

