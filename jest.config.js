/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: ['utils/**/*.{ts,tsx}', 'db/**/*.{ts,tsx}', 'store/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  coverageThreshold: {
    global: {
      lines: 35,
      functions: 35,
      statements: 35,
      branches: 25
    },
    './db/': { lines: 80, functions: 80, statements: 80 },
    './hooks/': { lines: 80, functions: 80, statements: 80 },
  },
  passWithNoTests: true
};
