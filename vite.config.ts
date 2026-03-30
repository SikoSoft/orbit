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
  };
});
