import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.eslint.json'] })],
  optimizeDeps: {
    include: [
      'api-spec/models/Entity',
      'api-spec/models/List',
      'api-spec/models/Operation',
      'api-spec/models/Data',
      'api-spec/models/Setting',
      '@sqlite.org/sqlite-wasm',
      'uuid',
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          include: [
            'src/tests/browser/**/*.test.ts',
            'src/components/**/*.test.ts',
          ],
        },
      },
    ],
  },
});
