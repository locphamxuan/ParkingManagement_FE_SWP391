/* ESLint config cho PBMS FE (React 18 + TypeScript + Vite). */
const jsxA11y = require('eslint-plugin-jsx-a11y');

// jsx-a11y/recommended đặt hầu hết rule ở mức 'error'; hạ xuống 'warn' vì codebase
// hiện có sẵn nhiều vi phạm chưa dọn (rule mới thêm, không muốn chặn build ngay).
const jsxA11yWarnRules = Object.fromEntries(
  Object.entries(jsxA11y.configs.recommended.rules).map(([rule, severity]) => [
    rule,
    Array.isArray(severity) ? ['warn', ...severity.slice(1)] : severity === 'off' ? 'off' : 'warn',
  ]),
);

module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'vite.config.js', '*.cjs'],
  rules: {
    ...jsxA11yWarnRules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Cho phép _prefix để đánh dấu tham số cố ý không dùng.
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
    'eqeqeq': ['warn', 'smart'],
  },
};
