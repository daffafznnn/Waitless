/* FILE: jest.config.js */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/server'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/src/server/tests/setup.ts'],
  collectCoverageFrom: [
    'src/server/**/*.ts',
    '!src/server/**/*.d.ts',
    '!src/server/tests/**',
    '!src/server/migrations/**',
    '!src/server/seeders/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};