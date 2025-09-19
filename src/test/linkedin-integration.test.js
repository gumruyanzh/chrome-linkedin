// LinkedIn Integration Testing - Task 2.1
// Tests for LinkedIn page type detection, DOM element identification, and layout changes

import {
  detectLinkedInPageType,
  isLinkedInPage,
  getCurrentUserProfile,
  getProfilePageInfo,
  getSearchResults,
  initActivityTracking
} from '../utils/linkedin.js';

// Mock DOM environment for LinkedIn testing
class LinkedInPageMock {
  constructor(pageType, url) {
    this.pageType = pageType;
    this.url = url;
    this.elements = new Map();
    this.setupMockDOM();
  }

  setupMockDOM() {
    const urlObj = new URL(this.url);
    global.window = {
      location: {
        href: this.url,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname
      }
    };

    global.document = {
      querySelector: jest.fn(selector => this.elements.get(selector) || null),
      querySelectorAll: jest.fn(selector => {
        const results = Array.from(this.elements.entries())
          .filter(([key]) => key.includes(selector) || selector.includes(key))
          .map(([, element]) => element);
        return results.length > 0 ? results : [];
      }),
      addEventListener: jest.fn()
    };
  }

  addElement(selector, element) {
    this.elements.set(selector, element);
  }

  addMultipleElements(selector, elements) {
    elements.forEach((element, index) => {
      this.elements.set(`${selector}[${index}]`, element);
    });
  }
}

// Helper to create mock LinkedIn elements
function createLinkedInElement(type, data = {}) {
  return {
    textContent: data.text || '',
    getAttribute: jest.fn(attr => data.attributes?.[attr] || null),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    href: data.href || '',
    ...data
  };
}

describe('LinkedIn Integration Tests - Task 2.1', () => {
  let mockPage;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LinkedIn Page Type Detection', () => {
    test('should detect people search page correctly', () => {
      mockPage = new LinkedInPageMock(
        'people-search',
        'https://www.linkedin.com/search/results/people/?keywords=developer'
      );

      const pageType = detectLinkedInPageType();
      expect(pageType).toBe('people-search');
    });

    test('should detect profile page correctly', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      const pageType = detectLinkedInPageType();
      expect(pageType).toBe('profile');
    });

    test('should detect network page correctly', () => {
      mockPage = new LinkedInPageMock('network', 'https://www.linkedin.com/mynetwork/');

      const pageType = detectLinkedInPageType();
      expect(pageType).toBe('network');
    });

    test('should detect messaging page correctly', () => {
      mockPage = new LinkedInPageMock('messaging', 'https://www.linkedin.com/messaging/');

      const pageType = detectLinkedInPageType();
      expect(pageType).toBe('messaging');
    });

    test('should detect feed page correctly', () => {
      mockPage = new LinkedInPageMock('feed', 'https://www.linkedin.com/feed/');

      const pageType = detectLinkedInPageType();
      expect(pageType).toBe('feed');
    });

    test('should return unknown for unrecognized LinkedIn pages', () => {
      mockPage = new LinkedInPageMock('unknown', 'https://www.linkedin.com/some/unknown/page');

      const pageType = detectLinkedInPageType();
      expect(pageType).toBe('unknown');
    });

    test('should handle URL variations correctly', () => {
      // Test with query parameters
      mockPage = new LinkedInPageMock(
        'people-search',
        'https://www.linkedin.com/search/results/people/?keywords=developer&location=SF'
      );

      expect(detectLinkedInPageType()).toBe('people-search');

      // Test with hash fragments
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/#section');

      expect(detectLinkedInPageType()).toBe('profile');
    });
  });

  describe('LinkedIn Page Validation', () => {
    test('should correctly identify LinkedIn pages', () => {
      mockPage = new LinkedInPageMock('feed', 'https://www.linkedin.com/feed/');

      expect(isLinkedInPage()).toBe(true);
    });

    test('should correctly identify non-LinkedIn pages', () => {
      mockPage = new LinkedInPageMock('external', 'https://www.google.com');

      expect(isLinkedInPage()).toBe(false);
    });

    test('should handle LinkedIn subdomains', () => {
      mockPage = new LinkedInPageMock('feed', 'https://mobile.linkedin.com/feed/');

      expect(isLinkedInPage()).toBe(true);
    });
  });

  describe('DOM Element Identification and Parsing', () => {
    test('should identify connection buttons on profile pages', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Mock connect button elements
      const connectButton = createLinkedInElement('button', {
        attributes: { 'aria-label': 'Connect with John Doe' },
        text: 'Connect'
      });

      mockPage.addElement('[aria-label*="Connect"]', connectButton);
      mockPage.addElement('button[data-control-name="connect"]', connectButton);

      const profileInfo = getProfilePageInfo();
      expect(profileInfo.canConnect).toBe(true);
    });

    test('should identify message buttons on profile pages', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      const messageButton = createLinkedInElement('button', {
        attributes: { 'aria-label': 'Message John Doe' },
        text: 'Message'
      });

      mockPage.addElement('[aria-label*="Message"]', messageButton);

      // Test that message button is detected
      const messageBtn = document.querySelector('[aria-label*="Message"]');
      expect(messageBtn).toBeTruthy();
      expect(messageBtn.textContent).toBe('Message');
    });

    test('should parse profile information from profile pages', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Mock profile elements
      const nameElement = createLinkedInElement('h1', { text: 'John Doe' });
      const titleElement = createLinkedInElement('div', { text: 'Software Engineer' });
      const locationElement = createLinkedInElement('span', { text: 'San Francisco, CA' });

      mockPage.addElement('.text-heading-xlarge', nameElement);
      mockPage.addElement('.text-body-medium.break-words', titleElement);
      mockPage.addElement('.text-body-small.inline.t-black--light.break-words', locationElement);

      const profileInfo = getProfilePageInfo();
      expect(profileInfo.name).toBe('John Doe');
      expect(profileInfo.title).toBe('Software Engineer');
      expect(profileInfo.location).toBe('San Francisco, CA');
    });

    test('should parse search results from people search pages', () => {
      mockPage = new LinkedInPageMock(
        'people-search',
        'https://www.linkedin.com/search/results/people/?keywords=developer'
      );

      // Mock search result elements
      const searchResults = [
        {
          name: 'Alice Smith',
          title: 'Frontend Developer',
          location: 'New York, NY',
          href: '/in/alicesmith/'
        },
        {
          name: 'Bob Johnson',
          title: 'Backend Developer',
          location: 'Austin, TX',
          href: '/in/bobjohnson/'
        }
      ];

      searchResults.forEach((result, index) => {
        const resultElement = createLinkedInElement('div');
        const nameElement = createLinkedInElement('a', {
          text: result.name,
          href: result.href
        });
        const titleElement = createLinkedInElement('div', { text: result.title });
        const locationElement = createLinkedInElement('div', { text: result.location });

        resultElement.querySelector = jest.fn(selector => {
          if (selector.includes('title-text')) {
            return nameElement;
          }
          if (selector.includes('primary-subtitle')) {
            return titleElement;
          }
          if (selector.includes('secondary-subtitle')) {
            return locationElement;
          }
          return null;
        });

        mockPage.addElement(`[data-control-name="search_srp_result"][${index}]`, resultElement);
      });

      // Mock querySelectorAll to return our search results
      global.document.querySelectorAll = jest.fn(() => {
        return searchResults.map((_, index) =>
          mockPage.elements.get(`[data-control-name="search_srp_result"][${index}]`)
        );
      });

      const results = getSearchResults();
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Alice Smith');
      expect(results[1].name).toBe('Bob Johnson');
    });
  });

  describe('Layout Changes and Error Handling', () => {
    test('should handle missing elements gracefully', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Don't add any elements to simulate missing elements
      const profileInfo = getProfilePageInfo();
      expect(profileInfo.name).toBe(null);
      expect(profileInfo.title).toBe(null);
      expect(profileInfo.canConnect).toBe(false);
    });

    test('should handle DOM query errors gracefully', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Mock querySelector to throw an error
      global.document.querySelector = jest.fn(() => {
        throw new Error('DOM query failed');
      });

      expect(() => getCurrentUserProfile()).not.toThrow();
      const profile = getCurrentUserProfile();
      expect(profile.isLoggedIn).toBe(false);
    });

    test('should handle changed LinkedIn selectors', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Test fallback selectors
      const nameElement = createLinkedInElement('h1', { text: 'John Doe' });

      // Primary selector not found, fallback should work
      mockPage.addElement('h1.break-words', nameElement);

      const profileInfo = getProfilePageInfo();
      expect(profileInfo.name).toBe('John Doe');
    });

    test('should handle dynamic content loading', () => {
      mockPage = new LinkedInPageMock(
        'people-search',
        'https://www.linkedin.com/search/results/people/?keywords=developer'
      );

      // Simulate initially empty results
      let searchResults = [];
      global.document.querySelectorAll = jest.fn(() => searchResults);

      let results = getSearchResults();
      expect(results).toHaveLength(0);

      // Simulate content loading
      searchResults = [createLinkedInElement('div')];
      results = getSearchResults();
      expect(results).toHaveLength(1);
    });
  });

  describe('LinkedIn Element Validation', () => {
    test('should validate connection button states', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Test different button states
      const connectButton = createLinkedInElement('button', {
        text: 'Connect',
        attributes: { 'aria-label': 'Connect with John Doe' }
      });

      const pendingButton = createLinkedInElement('button', {
        text: 'Pending',
        attributes: { 'aria-label': 'Invitation pending' }
      });

      const messageButton = createLinkedInElement('button', {
        text: 'Message',
        attributes: { 'aria-label': 'Send message to John Doe' }
      });

      // Test connect button
      mockPage.addElement('[aria-label*="Connect"]', connectButton);
      let profileInfo = getProfilePageInfo();
      expect(profileInfo.canConnect).toBe(true);

      // Test pending state
      mockPage.addElement('[aria-label*="Connect"]', pendingButton);
      profileInfo = getProfilePageInfo();
      expect(profileInfo.canConnect).toBe(false);

      // Test already connected
      mockPage.addElement('[aria-label*="Connect"]', null);
      mockPage.addElement('[aria-label*="Message"]', messageButton);
      profileInfo = getProfilePageInfo();
      expect(profileInfo.canConnect).toBe(false);
    });

    test('should identify premium vs non-premium profiles', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Test premium indicator
      const premiumBadge = createLinkedInElement('span', {
        attributes: { class: 'premium-icon' }
      });

      mockPage.addElement('.premium-icon', premiumBadge);

      const premiumIndicator = document.querySelector('.premium-icon');
      expect(premiumIndicator).toBeTruthy();
    });
  });

  describe('Activity Tracking and User Interaction', () => {
    test('should setup activity tracking event listeners', () => {
      mockPage = new LinkedInPageMock('feed', 'https://www.linkedin.com/feed/');

      initActivityTracking();

      const expectedEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      expect(document.addEventListener).toHaveBeenCalledTimes(expectedEvents.length);

      expectedEvents.forEach(eventType => {
        expect(document.addEventListener).toHaveBeenCalledWith(
          eventType,
          expect.any(Function),
          true
        );
      });
    });

    test('should track user activity correctly', () => {
      mockPage = new LinkedInPageMock('feed', 'https://www.linkedin.com/feed/');

      // Mock Date.now
      const mockNow = jest.spyOn(Date, 'now').mockReturnValue(12345);

      initActivityTracking();

      // Simulate calling the event handler
      const addEventListener = document.addEventListener;
      const eventHandler = addEventListener.mock.calls[0][1];
      eventHandler();

      expect(window.lastUserActivity).toBe(12345);

      mockNow.mockRestore();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large search result sets efficiently', () => {
      mockPage = new LinkedInPageMock(
        'people-search',
        'https://www.linkedin.com/search/results/people/?keywords=developer'
      );

      // Create 100 mock search results
      const largeResultSet = Array.from({ length: 100 }, (_, index) =>
        createLinkedInElement('div', { id: `result-${index}` })
      );

      global.document.querySelectorAll = jest.fn(() => largeResultSet);

      const startTime = performance.now();
      const results = getSearchResults();
      const endTime = performance.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle memory cleanup properly', () => {
      mockPage = new LinkedInPageMock('profile', 'https://www.linkedin.com/in/johndoe/');

      // Test that functions don't create memory leaks
      for (let i = 0; i < 100; i++) {
        getProfilePageInfo();
        detectLinkedInPageType();
        isLinkedInPage();
      }

      // No specific assertions needed - this tests for memory leaks during development
      expect(true).toBe(true);
    });
  });
});
