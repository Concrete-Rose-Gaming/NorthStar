import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
      '@shared': '../shared/src'
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
    commonjsOptions: {
      include: [/shared/, /node_modules/]
    }
  }
});

