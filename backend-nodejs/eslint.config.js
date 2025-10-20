import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier/flat';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      import: importPlugin
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs']
        }
      }
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.config.js',
            '**/*.config.cjs',
            '**/*.config.mjs',
            '**/*.test.js'
          ]
        }
      ],
      'import/no-unresolved': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': [
        'warn',
        { allow: ['error', 'warn', 'info'] }
      ]
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      import: importPlugin
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs', '.cjs']
        }
      }
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.config.js',
            '**/*.config.cjs',
            '**/*.config.mjs',
            '**/*.test.js'
          ]
        }
      ],
      'import/no-unresolved': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': [
        'warn',
        { allow: ['error', 'warn', 'info'] }
      ]
    }
  },
  prettierConfig
];
