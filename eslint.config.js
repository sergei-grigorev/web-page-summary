import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      // Code quality rules
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-console': 'off', // Allow console for CLI tool
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Style rules
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      
      // Best practices
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      
      // ES6+ rules
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    rules: {
      // Relax some rules for test files
      'no-unused-expressions': 'off',
    },
  },
];
