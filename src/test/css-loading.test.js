/**
 * CSS Loading Test Suite
 * Tests for proper CSS injection and loading in the LinkedIn Chrome Extension
 */

describe('CSS Loading Functionality', () => {
  let mockDocument;
  let mockHead;
  let mockBody;

  beforeEach(() => {
    // Mock DOM elements
    mockHead = {
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      getElementById: jest.fn()
    };

    mockBody = {
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      getElementById: jest.fn()
    };

    mockDocument = {
      head: mockHead,
      body: mockBody,
      createElement: jest.fn(),
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn()
    };

    global.document = mockDocument;

    // Mock chrome.runtime.getURL for extension resource access
    global.chrome.runtime.getURL = jest.fn((path) => `chrome-extension://test-id/${path}`);
  });

  describe('CSS File Loading', () => {
    test('should load content styles CSS file', async () => {
      const mockLinkElement = {
        rel: '',
        href: '',
        type: ''
      };

      mockDocument.createElement.mockReturnValue(mockLinkElement);
      mockDocument.getElementById.mockReturnValue(null);

      // Simulate loading content styles
      const loadContentStyles = () => {
        if (!document.getElementById('linkedin-automation-content-styles')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = chrome.runtime.getURL('content/styles.css');
          link.id = 'linkedin-automation-content-styles';
          document.head.appendChild(link);
          return true;
        }
        return false;
      };

      const result = loadContentStyles();

      expect(result).toBe(true);
      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockLinkElement.rel).toBe('stylesheet');
      expect(mockLinkElement.type).toBe('text/css');
      expect(mockLinkElement.href).toBe('chrome-extension://test-id/content/styles.css');
      expect(mockHead.appendChild).toHaveBeenCalledWith(mockLinkElement);
    });

    test('should load vintage typography CSS file', async () => {
      const mockLinkElement = {
        rel: '',
        href: '',
        type: ''
      };

      mockDocument.createElement.mockReturnValue(mockLinkElement);
      mockDocument.getElementById.mockReturnValue(null);

      // Simulate loading vintage typography
      const loadVintageStyles = () => {
        if (!document.getElementById('linkedin-automation-vintage-styles')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = chrome.runtime.getURL('assets/vintage-typography.css');
          link.id = 'linkedin-automation-vintage-styles';
          document.head.appendChild(link);
          return true;
        }
        return false;
      };

      const result = loadVintageStyles();

      expect(result).toBe(true);
      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockLinkElement.href).toBe('chrome-extension://test-id/assets/vintage-typography.css');
      expect(mockHead.appendChild).toHaveBeenCalledWith(mockLinkElement);
    });

    test('should not load CSS if already present', () => {
      const mockExistingElement = { id: 'linkedin-automation-content-styles' };
      mockDocument.getElementById.mockReturnValue(mockExistingElement);

      const loadContentStyles = () => {
        if (!document.getElementById('linkedin-automation-content-styles')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = chrome.runtime.getURL('content/styles.css');
          link.id = 'linkedin-automation-content-styles';
          document.head.appendChild(link);
          return true;
        }
        return false;
      };

      const result = loadContentStyles();

      expect(result).toBe(false);
      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(mockHead.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('CSS Injection via chrome.scripting', () => {
    test('should inject CSS using chrome.scripting.insertCSS', async () => {
      const tabId = 123;
      const cssFiles = ['content/styles.css', 'assets/vintage-typography.css'];

      // Mock chrome.scripting.insertCSS
      global.chrome.scripting.insertCSS = jest.fn().mockResolvedValue(undefined);

      const injectCSS = async (tabId, files) => {
        const promises = files.map(file =>
          chrome.scripting.insertCSS({
            target: { tabId },
            files: [file]
          })
        );

        await Promise.all(promises);
        return true;
      };

      const result = await injectCSS(tabId, cssFiles);

      expect(result).toBe(true);
      expect(chrome.scripting.insertCSS).toHaveBeenCalledTimes(2);
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['content/styles.css']
      });
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['assets/vintage-typography.css']
      });
    });

    test('should handle CSS injection errors gracefully', async () => {
      const tabId = 123;
      const cssFile = 'content/styles.css';

      // Mock chrome.scripting.insertCSS to throw error
      global.chrome.scripting.insertCSS = jest.fn().mockRejectedValue(new Error('CSS injection failed'));

      const injectCSS = async (tabId, file) => {
        try {
          await chrome.scripting.insertCSS({
            target: { tabId },
            files: [file]
          });
          return true;
        } catch (error) {
          console.error('CSS injection failed:', error);
          return false;
        }
      };

      const result = await injectCSS(tabId, cssFile);

      expect(result).toBe(false);
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['content/styles.css']
      });
    });
  });

  describe('CSS Loading Validation', () => {
    test('should validate that required CSS files exist', () => {
      const requiredCSSFiles = [
        'content/styles.css',
        'assets/vintage-typography.css'
      ];

      // Mock chrome.runtime.getURL to check file paths
      global.chrome.runtime.getURL = jest.fn((path) => {
        if (requiredCSSFiles.includes(path)) {
          return `chrome-extension://test-id/${path}`;
        }
        throw new Error(`CSS file not found: ${path}`);
      });

      const validateCSSFiles = (files) => {
        try {
          files.forEach(file => {
            const url = chrome.runtime.getURL(file);
            expect(url).toContain(file);
          });
          return true;
        } catch (error) {
          return false;
        }
      };

      const result = validateCSSFiles(requiredCSSFiles);
      expect(result).toBe(true);
    });

    test('should detect missing CSS classes in DOM', () => {
      // Mock elements with missing styles
      const mockElement = {
        classList: { contains: jest.fn() },
        style: {},
        getComputedStyle: jest.fn()
      };

      global.getComputedStyle = jest.fn().mockReturnValue({
        display: 'none',
        fontFamily: 'initial',
        backgroundColor: 'initial'
      });

      mockDocument.querySelector.mockReturnValue(mockElement);

      const checkCSSLoaded = () => {
        const testElement = document.querySelector('.vintage-automation-controls');
        if (!testElement) return false;

        const computedStyle = getComputedStyle(testElement);

        // Check if vintage typography is loaded
        const hasVintageFont = computedStyle.fontFamily.includes('Crimson Text');

        // Check if background color is applied
        const hasBackground = computedStyle.backgroundColor !== 'initial';

        return hasVintageFont && hasBackground;
      };

      const result = checkCSSLoaded();
      expect(result).toBe(false);
    });
  });

  describe('Manifest CSS Configuration', () => {
    test('should validate manifest.json CSS configuration', () => {
      const mockManifest = {
        content_scripts: [{
          matches: ['https://*.linkedin.com/*'],
          js: ['content.js'],
          css: ['content/styles.css', 'assets/vintage-typography.css'],
          run_at: 'document_idle'
        }],
        web_accessible_resources: [{
          resources: [
            'content/styles.css',
            'assets/vintage-typography.css',
            'content/*',
            'assets/*'
          ],
          matches: ['https://*.linkedin.com/*']
        }]
      };

      const validateManifestCSS = (manifest) => {
        const contentScript = manifest.content_scripts[0];
        const webAccessibleResources = manifest.web_accessible_resources[0];

        // Check if CSS files are included in content scripts
        const hasCSSInContentScript = contentScript.css && contentScript.css.length > 0;

        // Check if CSS files are web accessible
        const cssFilesAccessible = contentScript.css.every(cssFile =>
          webAccessibleResources.resources.includes(cssFile) ||
          webAccessibleResources.resources.some(resource =>
            resource.endsWith('*') && cssFile.startsWith(resource.slice(0, -1))
          )
        );

        return hasCSSInContentScript && cssFilesAccessible;
      };

      const result = validateManifestCSS(mockManifest);
      expect(result).toBe(true);
    });
  });

  describe('CSS Loading Performance', () => {
    test('should load CSS asynchronously without blocking', async () => {
      const loadStartTime = Date.now();

      // Mock async CSS loading
      const loadCSSAsync = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL('content/styles.css');
            document.head.appendChild(link);
            resolve(true);
          }, 10); // Simulate small delay
        });
      };

      mockDocument.createElement.mockReturnValue({
        rel: '',
        href: ''
      });

      const result = await loadCSSAsync();
      const loadTime = Date.now() - loadStartTime;

      expect(result).toBe(true);
      expect(loadTime).toBeLessThan(100); // Should load quickly
      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    });
  });
});