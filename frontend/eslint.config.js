import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist/**'] },

  // Baseline correctness rules only (no stylistic or framework-specific rules).
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // Build tooling runs in Node, not the browser.
  {
    files: ['vite.config.js'],
    languageOptions: { globals: globals.node },
  },
]
