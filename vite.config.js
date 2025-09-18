import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'popup/popup': resolve(__dirname, 'src/popup/popup.html'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.js'),
        'content/linkedin-automation': resolve(__dirname, 'src/content/linkedin-automation.js'),
        'styles/tailwind': resolve(__dirname, 'src/styles/tailwind.css')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]',
        dir: 'dist'
      }
    },
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    target: 'es2020'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  server: {
    hmr: false // Disable HMR for Chrome extension development
  }
});