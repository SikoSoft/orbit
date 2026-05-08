import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.BASE_URL || '/',
    envPrefix: 'APP_',
    plugins: [tsconfigPaths(), wasm(), topLevelAwait()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/lit/') ||
              id.includes('node_modules/@lit/') ||
              id.includes('node_modules/@adobe/lit-mobx')
            ) {
              return 'vendor-lit';
            }
            if (id.includes('node_modules/mobx/')) {
              return 'vendor-mobx';
            }
            if (
              id.includes('node_modules/marked/') ||
              id.includes('node_modules/dompurify/')
            ) {
              return 'vendor-text';
            }
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@sqlite.org/sqlite-wasm'],
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  };
});
