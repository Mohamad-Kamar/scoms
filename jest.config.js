/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/src/utils/jest.init.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/utils/jest.setup.ts"],
  testTimeout: 10000, // Increase timeout for integration tests
  verbose: true,
  detectOpenHandles: true, // Help identify unfinished async operations
};
