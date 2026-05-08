import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        external: (id) => {
          // Pacchetti server-only che non devono finire nel bundle browser
          if (id === 'firebase-admin' || id.startsWith('firebase-admin/')) return true;
          if (id === '@anthropic-ai/sdk' || id.startsWith('@anthropic-ai/sdk/')) return true;
          if (id === 'resend' || id.startsWith('resend/')) return true;
          if (id === '@vercel/node' || id.startsWith('@vercel/node/')) return true;
          return false;
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
  };
});
