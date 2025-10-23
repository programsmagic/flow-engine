// Jest setup file
import 'jest';

// Global test setup
beforeAll(() => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});

// Global test utilities
global.testUtils = {
  createMockFile: (content: string, extension: string = '.js') => {
    return {
      content,
      extension,
      path: `/mock/file${extension}`
    };
  },
  
  createMockComponent: (name: string, framework: string = 'react') => {
    return {
      name,
      framework,
      language: 'javascript',
      methods: [],
      filePath: `/mock/${name}.js`
    };
  }
};
