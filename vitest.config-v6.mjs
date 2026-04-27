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
      'api-spec/lib/Revision',
      '@sqlite.org/sqlite-wasm',
      'uuid',
      '@adobe/lit-mobx',
      'mobx',
      'immer',
      'marked',
      'dompurify',
      'jszip',
      'file-saver',
      'lit/directives/class-map.js',
      'lit/directives/repeat.js',
      'lit/directives/unsafe-html.js',
      'lit/directives/if-defined.js',
      'lit/static-html.js',
      '@ss/ui/components/confirmation-modal',
      '@ss/ui/components/file-upload',
      '@ss/ui/components/notification-provider',
      '@ss/ui/components/notification-provider.models',
      '@ss/ui/components/pop-up',
      '@ss/ui/components/sortable-item',
      '@ss/ui/components/sortable-list',
      '@ss/ui/components/ss-button',
      '@ss/ui/components/ss-carousel',
      '@ss/ui/components/ss-collapsable',
      '@ss/ui/components/ss-collapsable.events',
      '@ss/ui/components/ss-icon',
      '@ss/ui/components/ss-input',
      '@ss/ui/components/ss-input.models',
      '@ss/ui/components/ss-loader',
      '@ss/ui/components/ss-select',
      '@ss/ui/components/tab-container',
      '@ss/ui/components/tab-pane',
      '@ss/ui/components/tag-manager',
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
            screenshotFailures: false,
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
