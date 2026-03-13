/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: ['utils/**/*.{ts,tsx}', 'db/**/*.{ts,tsx}', 'store/**/*.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  coverageThreshold: {
    global: {
      lines: 80
    }
  },
  passWithNoTests: true
};
