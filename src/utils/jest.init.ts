// src/utils/jest.init.ts
// Setup environment variables and global settings for Jest tests

// Set test environment to ensure consistent test behavior
process.env.NODE_ENV = "test";

// Disable logging during tests
jest.mock("./logger", () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Define global timeout for all tests
jest.setTimeout(10000);
