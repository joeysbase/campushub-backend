import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  // The first run downloads a MongoDB binary for mongodb-memory-server.
  testTimeout: 30_000,

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // process startup: connects to the real DB and listens
    '!src/config/**',
    '!src/scripts/**',
    '!src/test/**',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'text-summary', 'html'],
  coverageThreshold: {
    global: { statements: 80, branches: 80 },
    './src/services/': { statements: 80, branches: 80 },
    './src/controllers/': { statements: 80, branches: 80 },
  },
};

// CommonJS export: the package is CommonJS, so Node's built-in TypeScript loader can read this file.
module.exports = config;
