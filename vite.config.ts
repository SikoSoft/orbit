import { defineConfig, loadEnv } from 'vite';
import wasm from 'vite-plugin-wasm';
import ts from 'typescript';

// Oxc (Vite 8's default transformer) has a bug with TypeScript legacy decorators
// on computed property names ([BooleanFieldProp.VALUE] style). It passes null as
// the decorator key, causing the TC39 branch in Lit's property() to crash.
// Use TypeScript's own transpileModule instead, which handles this correctly.
const tsLegacyDecoratorPlugin = {
  name: 'ts-legacy-decorators',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/\.tsx?$/.test(id) || id.includes('node_modules') || id.endsWith('.d.ts')) {
      return null;
    }
    const result = ts.transpileModule(code, {
      fileName: id,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        experimentalDecorators: true,
        useDefineForClassFields: false,
        sourceMap: true,
        inlineSourceMap: false,
      },
      reportDiagnostics: false,
    });
    return {
      code: result.outputText.replace(/\/\/# sourceMappingURL=\S+\n?$/, ''),
      map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
    };
  },
};

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.BASE_URL || '/',
    envPrefix: 'APP_',
    plugins: [tsLegacyDecoratorPlugin, wasm()],
    oxc: false,
    resolve: {
      tsconfigPaths: true,
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
