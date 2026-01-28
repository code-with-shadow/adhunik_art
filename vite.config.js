import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react({
      // Fast refresh is on by default, no need to force it, but this is fine
      fastRefresh: true,
    }),
    compression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['redux', 'react-redux', '@reduxjs/toolkit'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Great for production
        drop_debugger: true,
      },
    },
    sourcemap: false,
    target: 'esnext',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'redux', 'react-redux', '@reduxjs/toolkit', 
      'lucide-react',
    ],
  },
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1',
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws',
    },
  },
});