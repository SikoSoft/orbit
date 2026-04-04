import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import rollupAlias from '@rollup/plugin-alias';
import { fileURLToPath } from 'url';
import path from 'path';

const alias = fromRollup(rollupAlias);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  files: 'src/components/**/*.test.ts',
  nodeResolve: true,
  browsers: [playwrightLauncher({ product: 'chromium' })],
  plugins: [
    alias({
      entries: [
        { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
      ],
    }),
    esbuildPlugin({
      ts: true,
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    }),
  ],
};
