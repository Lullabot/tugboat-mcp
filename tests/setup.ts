/**
 * Jest test setup file
 * 
 * This file runs before each test file and is used to set up test environment,
 * global mocks, or other configurations that need to be applied to all tests.
 */

// Increase default timeout to 10 seconds for all tests
jest.setTimeout(10000);

// Silence console logs during tests unless we're in verbose mode
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error logging for debugging purposes
    error: console.error,
  } as any;
}

// Mock the fs module for all tests to prevent real filesystem operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  }
}));

// Setup global beforeEach and afterEach hooks
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Any cleanup needed after each test
}); 