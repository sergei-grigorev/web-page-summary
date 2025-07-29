/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types/index',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/modules/utils/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/constants$': '<rootDir>/src/constants'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/src/**/__tests__/**/*.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/tests/scraper-test.ts' // Exclude manual test file
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts' // Exclude CLI entry point
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022'
      }
    }]
  },
  
  // Setup and teardown
  setupFilesAfterEnv: [],
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Timeout
  testTimeout: 30000,
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance and reliability
  maxWorkers: '50%',
  detectOpenHandles: true,
  forceExit: false,
  
  // Verbose output
  verbose: true
};