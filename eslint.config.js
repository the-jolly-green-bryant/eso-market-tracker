import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'
import sonarjs from 'eslint-plugin-sonarjs'

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'data/**/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,

  {
    languageOptions: {
      globals: globals.node,
    },

    plugins: {
      jsdoc,
    },

    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'max-lines-per-function': ['error', 80],
      '@typescript-eslint/no-unused-expressions': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/slow-regex': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          contexts: [
            'FunctionDeclaration',
            'ClassDeclaration',
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
          ],
        },
      ],
    },

    settings: {
      jsdoc: {
        mode: 'typescript',
      },
    },
  },
]
