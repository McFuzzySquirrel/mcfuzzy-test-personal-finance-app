module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.e2e.(js|ts)'],
  testTimeout: 180000,
  maxWorkers: 1,
  testRunner: 'jest-circus/runner',
  setupFilesAfterEnv: ['<rootDir>/init.js'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
