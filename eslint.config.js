import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'Bedar Design System (2)'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // `api/` (Vercel serverless functions) and `lib/` (their shared
    // helpers) run in Node, not the browser — they read `process.env`
    // and never ship in the client bundle. Give them Node globals.
    files: ['api/**/*.js', 'lib/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // A context file exports its Provider and its `useX` hook together.
    // Splitting them apart to satisfy Fast Refresh would scatter every
    // context across two files for a dev-only HMR nicety, so the rule
    // is off here. Fast Refresh falls back to a full reload when a
    // context file changes, which is the correct behaviour anyway —
    // provider state has to be rebuilt.
    files: ['src/context/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
