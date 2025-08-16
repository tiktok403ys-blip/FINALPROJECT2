const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.admin.setup.js'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/app/admin/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/app/admin/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/scripts/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/scripts/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/admin/(.*)$': '<rootDir>/app/admin/$1',
    '^@/admin/components/(.*)$': '<rootDir>/components/admin/$1',
    '^@/admin/hooks/(.*)$': '<rootDir>/hooks/$1'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/admin/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!app/admin/**/*.d.ts',
    '!app/admin/**/*.stories.{ts,tsx}',
    '!app/admin/**/index.{ts,tsx}'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './app/admin-v2/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './app/admin-v2/hooks/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage directory
  coverageDirectory: 'coverage/admin',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\.mjs$|@supabase|@tanstack))'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global test variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.admin.json'
    }
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);