import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier/flat';

const reactRecommended = pluginReact.configs?.flat?.recommended ?? {};

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      // Legacy modules awaiting refactors still contain syntax incompatibilities with the flat config.
      'src/api/**',
      'src/components/audit-timeline/**',
      'src/components/calendar/**',
      'src/components/customerControl/**',
      'src/components/dashboard/**',
      'src/components/error/**',
      'src/components/orders/**',
      'src/components/service-management/**',
      'src/components/zones/**',
      'src/features/**',
      'src/hooks/**',
      'src/modules/**',
      'src/pages/**'
    ]
  },
  js.configs.recommended,
  reactRecommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  prettierConfig
];
