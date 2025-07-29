import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: '.',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable base ESLint rule in favor of TypeScript version
      'no-unused-vars': 'off',
      
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      
      // General rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-useless-escape': 'warn',
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'no-param-reassign': 'error',
      'eqeqeq': 'error',
      'curly': 'error',
      'no-unreachable': 'error',
      'no-lonely-if': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.test.json',
        tsconfigRootDir: '.',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable base ESLint rule in favor of TypeScript version
      'no-unused-vars': 'off',
      
      // TypeScript-specific rules (relaxed for tests)
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      
      // General rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-useless-escape': 'warn',
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'no-param-reassign': 'error',
      'eqeqeq': 'error',
      'curly': 'error',
      'no-unreachable': 'error',
      'no-lonely-if': 'error',
    },
  },
  {
    ignores: [
      'dist/**/*', 
      'node_modules/**/*',
      '*.js',
      '*.d.ts',
      'coverage/**/*'
    ]
  }
];