import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './webview/index.tsx',
      output: {
        entryFileNames: 'webview.js',
        format: 'iife',
      },
    },
    sourcemap: true,
    watch: {}
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './webview')
    }
  }
}); 