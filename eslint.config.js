import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist', 'build', '.react-router', '.vercel']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // React Router route modules export loaders/actions/meta alongside the
    // component; @react-router/dev handles their HMR, so the fast-refresh
    // restriction doesn't apply
    files: ['src/routes/**/*.tsx', 'src/root.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
