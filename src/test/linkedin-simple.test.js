// Simplified tests for LinkedIn utility functions
describe('LinkedIn Utilities - Basic Tests', () => {
  beforeEach(() => {
    // Reset global objects
    delete global.window;
    delete global.document;
  });

  describe('Basic Function Exports', () => {
    test('should import LinkedIn utilities without errors', async () => {
      // Mock window and document before importing
      global.window = {
        location: {
          href: 'https://www.linkedin.com/feed/',
          hostname: 'www.linkedin.com',
          pathname: '/feed/'
        }
      };

      global.document = {
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
      };

      const { detectLinkedInPageType, isLinkedInPage, humanDelay } = await import(
        '../utils/linkedin.js'
      );

      expect(typeof detectLinkedInPageType).toBe('function');
      expect(typeof isLinkedInPage).toBe('function');
      expect(typeof humanDelay).toBe('function');
    });

    test('humanDelay should return a promise', async () => {
      global.window = { location: { href: '', hostname: '', pathname: '' } };
      global.document = {
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
      };

      const { humanDelay } = await import('../utils/linkedin.js');
      const result = humanDelay(10, 20);

      expect(result).toBeInstanceOf(Promise);
      await result; // Ensure it resolves
    });
  });

  describe('Page Type Detection', () => {
    test('should detect LinkedIn pages correctly', async () => {
      // Test feed page
      global.window = {
        location: {
          href: 'https://www.linkedin.com/feed/',
          hostname: 'www.linkedin.com',
          pathname: '/feed/'
        }
      };
      global.document = {
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
      };

      const { detectLinkedInPageType, isLinkedInPage } = await import('../utils/linkedin.js');

      expect(detectLinkedInPageType()).toBe('feed');
      expect(isLinkedInPage()).toBe(true);
    });

    test('should detect non-LinkedIn pages', async () => {
      global.window = {
        location: {
          href: 'https://www.google.com',
          hostname: 'www.google.com',
          pathname: '/'
        }
      };
      global.document = {
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
      };

      const { isLinkedInPage } = await import('../utils/linkedin.js');

      expect(isLinkedInPage()).toBe(false);
    });
  });
});
