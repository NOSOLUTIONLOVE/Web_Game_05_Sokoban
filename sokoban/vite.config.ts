import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  // 静态部署时使用相对路径（Vercel / GitHub Pages / Netlify 通用）
  base: './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },

  server: {
    port: 5177,
    open: true,
    host: '127.0.0.1',
  },

  preview: {
    port: 4177,
    host: '127.0.0.1',
  },
});
