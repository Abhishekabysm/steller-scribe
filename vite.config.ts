import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              cmdk: ['cmdk'],
              radix: ['@radix-ui/react-dialog', '@radix-ui/react-dismissable-layer', '@radix-ui/react-portal', '@radix-ui/react-focus-guards', '@radix-ui/react-presence', '@radix-ui/react-focus-scope'],
            },
          },
        },
      },
    };
});
