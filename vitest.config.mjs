import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.eslint.json'] })],
  test: {
    environment: 'happy-dom',
    include: ['src/tests/unit/**/*.test.ts'],
  },
});
