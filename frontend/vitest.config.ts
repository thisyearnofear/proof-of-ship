/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';
import { transformSync } from 'esbuild';

/**
 * jsxInJs — Vite plugin that lets the test runner parse JSX inside `.js`
 * source files. The repo has many `.js` components that contain JSX
 * (the convention predates Next 16's Turbopack strictness), and Vite's
 * default import-analysis rejects them. We run esbuild with
 * `loader: "jsx"` on every `.js` import to normalize to plain JS before
 * the analysis pass.
 *
 * @returns {import('vite').Plugin}
 */
function jsxInJs() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('/node_modules/')) return null;
      if (!/\.jsx?$/.test(id)) return null;
      if (!/[<>]/.test(code)) return null;
      return transformSync(code, {
        loader: 'jsx',
        jsx: 'automatic',
        jsxImportSource: 'react',
        sourcefile: id,
        sourcemap: true,
      });
    },
  };
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**/*.ts', 'src/contexts/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
  },
  plugins: [jsxInJs()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
