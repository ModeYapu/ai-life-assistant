module.exports = {
  testRunner: 'jest-circus/runner',
  testTimeout: 180000,
  maxWorkers: 1,
  testMatch: ['**/*.e2e.js'],
  setupFilesAfterEnv: ['./init.js'],
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
