/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: ['utils/**/*.{ts,tsx}', 'db/**/*.{ts,tsx}', 'store/**/*.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  coverageThreshold: {
    // Pragmatic floor to prevent regressions while we expand tests toward PRD targets.
    // Follow-up target: enforce >=80% lines/functions for db/ and hooks/ per PRD.
    global: {
      lines: 35,
      functions: 35,
      statements: 35,
      branches: 25
    }
  },
  passWithNoTests: true
};
