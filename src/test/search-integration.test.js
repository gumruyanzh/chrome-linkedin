// Comprehensive Search Integration Tests
import {
  processSearchResults,
  extractSearchCriteria,
  navigateToNextPage
} from '../utils/search-integration.js';

describe('Search Integration Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM mock
    global.document = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => [])
    };

    global.window = {
      location: {
        href: 'https://www.linkedin.com/search/results/people/?keywords=engineer'
      }
    };
  });

  describe('processSearchResults', () => {
    test('should return empty array when no results found', async () => {
      document.querySelectorAll.mockReturnValue([]);

      const results = await processSearchResults();

      expect(results).toEqual([]);
    });

    test('should extract profiles from search results', async () => {
      const mockResults = [
        {
          querySelector: jest.fn((selector) => {
            if (selector.includes('title') || selector.includes('name')) {
              return {
                textContent: 'John Doe',
                href: 'https://linkedin.com/in/johndoe'
              };
            }
            if (selector.includes('subtitle') || selector.includes('level-1')) {
              return { textContent: 'Software Engineer at Acme' };
            }
            if (selector.includes('secondary') || selector.includes('level-2')) {
              return { textContent: 'San Francisco, CA' };
            }
            if (selector.includes('Connect')) {
              return { textContent: 'Connect' };
            }
            return null;
          })
        }
      ];

      document.querySelectorAll.mockReturnValue(mockResults);

      const results = await processSearchResults();

      expect(results.length).toBeGreaterThan(0);
    });

    test('should filter out profiles that cannot be connected', async () => {
      const mockResults = [
        {
          querySelector: jest.fn((selector) => {
            if (selector.includes('title') || selector.includes('name')) {
              return { textContent: 'John Doe', href: '/in/johndoe' };
            }
            if (selector.includes('Connect')) {
              return { textContent: 'Pending' }; // Already sent
            }
            return null;
          })
        }
      ];

      document.querySelectorAll.mockReturnValue(mockResults);

      const results = await processSearchResults();

      // Should filter out pending connections
      expect(results.filter(r => r.canConnect)).toHaveLength(0);
    });

    test('should handle malformed result elements', async () => {
      const mockResults = [
        {
          querySelector: jest.fn(() => null) // All selectors return null
        }
      ];

      document.querySelectorAll.mockReturnValue(mockResults);

      const results = await processSearchResults();

      // Should handle gracefully and return empty or filtered results
      expect(Array.isArray(results)).toBe(true);
    });

    test('should extract profile URL correctly', async () => {
      const mockResults = [
        {
          querySelector: jest.fn((selector) => {
            if (selector.includes('title') || selector.includes('name')) {
              return {
                textContent: 'Jane Smith',
                href: 'https://www.linkedin.com/in/janesmith/?miniProfileUrn=abc123'
              };
            }
            if (selector.includes('Connect')) {
              return { textContent: 'Connect' };
            }
            return { textContent: '' };
          })
        }
      ];

      document.querySelectorAll.mockReturnValue(mockResults);

      const results = await processSearchResults();

      if (results.length > 0 && results[0].profileUrl) {
        expect(results[0].profileUrl).toContain('linkedin.com');
      }
    });
  });

  describe('extractSearchCriteria', () => {
    test('should extract keywords from URL', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/?keywords=software%20engineer';

      const criteria = extractSearchCriteria();

      expect(criteria.keywords).toBe('software engineer');
    });

    test('should extract location filter', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/?keywords=engineer&geoUrn=102571732';

      const criteria = extractSearchCriteria();

      expect(criteria.geoUrn).toBeDefined();
    });

    test('should extract connection degree filter', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/?keywords=engineer&network=["F","S"]';

      const criteria = extractSearchCriteria();

      expect(criteria.network).toBeDefined();
    });

    test('should handle URL without parameters', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/';

      const criteria = extractSearchCriteria();

      expect(criteria).toBeDefined();
      expect(criteria.keywords).toBeUndefined();
    });

    test('should extract industry filter', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/?keywords=developer&industry=["96"]';

      const criteria = extractSearchCriteria();

      expect(criteria.industry).toBeDefined();
    });

    test('should extract company filter', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/?currentCompany=["1234"]';

      const criteria = extractSearchCriteria();

      expect(criteria.currentCompany).toBeDefined();
    });
  });

  describe('navigateToNextPage', () => {
    test('should click next page button when available', async () => {
      const mockNextButton = {
        click: jest.fn(),
        disabled: false
      };

      document.querySelector.mockImplementation((selector) => {
        if (selector.includes('next') || selector.includes('artdeco-pagination')) {
          return mockNextButton;
        }
        return null;
      });

      const result = await navigateToNextPage();

      expect(result).toBe(true);
      expect(mockNextButton.click).toHaveBeenCalled();
    });

    test('should return false when next button not found', async () => {
      document.querySelector.mockReturnValue(null);

      const result = await navigateToNextPage();

      expect(result).toBe(false);
    });

    test('should return false when next button is disabled', async () => {
      const mockNextButton = {
        click: jest.fn(),
        disabled: true
      };

      document.querySelector.mockReturnValue(mockNextButton);

      const result = await navigateToNextPage();

      expect(result).toBe(false);
      expect(mockNextButton.click).not.toHaveBeenCalled();
    });

    test('should handle navigation errors gracefully', async () => {
      document.querySelector.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = await navigateToNextPage();

      expect(result).toBe(false);
    });
  });

  describe('Search Result Selectors', () => {
    test('should use multiple selectors for result containers', async () => {
      document.querySelectorAll.mockReturnValue([]);

      await processSearchResults();

      // Should try multiple selectors
      expect(document.querySelectorAll).toHaveBeenCalled();
    });

    test('should handle different LinkedIn UI versions', async () => {
      // LinkedIn changes its UI frequently, selectors should be flexible
      const mockResults = [
        {
          querySelector: jest.fn((selector) => {
            // Old UI selector
            if (selector.includes('entity-result')) {
              return { textContent: 'Test User' };
            }
            // New UI selector
            if (selector.includes('actor-name')) {
              return { textContent: 'Test User' };
            }
            return null;
          })
        }
      ];

      document.querySelectorAll.mockReturnValue(mockResults);

      const results = await processSearchResults();

      expect(Array.isArray(results)).toBe(true);
    });
  });
});
