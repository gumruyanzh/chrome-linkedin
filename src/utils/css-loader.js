/**
 * CSS Loader Utility
 * Handles dynamic loading and injection of CSS files for the Chrome extension
 */

/**
 * Load CSS file by creating a link element
 * @param {string} cssPath - Path to the CSS file relative to extension root
 * @param {string} id - Unique ID for the link element
 * @returns {Promise<boolean>} - True if loaded successfully
 */
export function loadCSSFile(cssPath, id) {
  return new Promise((resolve) => {
    // Check if CSS is already loaded
    if (document.getElementById(id)) {
      resolve(false); // Already loaded
      return;
    }

    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = chrome.runtime.getURL(cssPath);
      link.id = id;

      // Add load event listener
      link.onload = () => {
        console.log(`CSS loaded successfully: ${cssPath}`);
        resolve(true);
      };

      link.onerror = (error) => {
        console.error(`Failed to load CSS: ${cssPath}`, error);
        resolve(false);
      };

      document.head.appendChild(link);
    } catch (error) {
      console.error(`Error loading CSS: ${cssPath}`, error);
      resolve(false);
    }
  });
}

/**
 * Load multiple CSS files in parallel
 * @param {Array<{path: string, id: string}>} cssFiles - Array of CSS file configs
 * @returns {Promise<{loaded: Array<string>, failed: Array<string>}>}
 */
export async function loadMultipleCSSFiles(cssFiles) {
  const results = await Promise.all(
    cssFiles.map(async ({ path, id }) => {
      const success = await loadCSSFile(path, id);
      return { path, id, success };
    })
  );

  const loaded = results.filter(r => r.success).map(r => r.path);
  const failed = results.filter(r => !r.success).map(r => r.path);

  return { loaded, failed };
}

/**
 * Inject CSS content directly as a style element
 * @param {string} cssContent - CSS content as string
 * @param {string} id - Unique ID for the style element
 * @returns {boolean} - True if injected successfully
 */
export function injectCSSContent(cssContent, id) {
  try {
    // Check if CSS is already injected
    if (document.getElementById(id)) {
      return false; // Already injected
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = id;
    style.textContent = cssContent;

    document.head.appendChild(style);
    console.log(`CSS content injected with ID: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error injecting CSS content with ID: ${id}`, error);
    return false;
  }
}

/**
 * Remove CSS by ID
 * @param {string} id - ID of the CSS element to remove
 * @returns {boolean} - True if removed successfully
 */
export function removeCSSById(id) {
  try {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
      console.log(`CSS removed with ID: ${id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error removing CSS with ID: ${id}`, error);
    return false;
  }
}

/**
 * Check if CSS is loaded by verifying computed styles
 * @param {string} selector - CSS selector to test
 * @param {string} property - CSS property to check
 * @param {string} expectedValue - Expected value (or partial match)
 * @returns {boolean} - True if CSS appears to be loaded
 */
export function isCSSLoaded(selector, property, expectedValue) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      // Create a test element if selector doesn't exist
      const testElement = document.createElement('div');
      testElement.className = selector.replace('.', '');
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);

      const computedStyle = getComputedStyle(testElement);
      const value = computedStyle.getPropertyValue(property);
      const isLoaded = value.includes(expectedValue);

      testElement.remove();
      return isLoaded;
    }

    const computedStyle = getComputedStyle(element);
    const value = computedStyle.getPropertyValue(property);
    return value.includes(expectedValue);
  } catch (error) {
    console.error(`Error checking CSS loaded state: ${selector}`, error);
    return false;
  }
}

/**
 * Wait for CSS to be loaded with timeout
 * @param {string} selector - CSS selector to test
 * @param {string} property - CSS property to check
 * @param {string} expectedValue - Expected value
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} - True if CSS loads within timeout
 */
export function waitForCSS(selector, property, expectedValue, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkCSS = () => {
      if (isCSSLoaded(selector, property, expectedValue)) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        console.warn(`CSS loading timeout for: ${selector}`);
        resolve(false);
        return;
      }

      setTimeout(checkCSS, 100);
    };

    checkCSS();
  });
}

/**
 * Load extension CSS files with validation
 * @returns {Promise<{success: boolean, errors: Array<string>}>}
 */
export async function loadExtensionCSS() {
  const cssFiles = [
    { path: 'content/styles.css', id: 'linkedin-automation-content-styles' },
    { path: 'assets/vintage-typography.css', id: 'linkedin-automation-vintage-styles' }
  ];

  try {
    const { loaded, failed } = await loadMultipleCSSFiles(cssFiles);

    if (failed.length > 0) {
      console.warn('Some CSS files failed to load:', failed);
    }

    // Validate that key CSS is working
    const validationTests = [
      {
        selector: '.vintage-automation-controls',
        property: 'font-family',
        expected: 'Crimson Text'
      },
      {
        selector: '.linkedin-automation-indicator',
        property: 'animation-name',
        expected: 'pulse'
      }
    ];

    const validationResults = await Promise.all(
      validationTests.map(test =>
        waitForCSS(test.selector, test.property, test.expected, 3000)
      )
    );

    const allValidated = validationResults.every(result => result);

    return {
      success: loaded.length > 0 && failed.length === 0 && allValidated,
      errors: failed,
      loaded: loaded,
      validated: allValidated
    };
  } catch (error) {
    console.error('Error loading extension CSS:', error);
    return {
      success: false,
      errors: [error.message],
      loaded: [],
      validated: false
    };
  }
}

/**
 * Create fallback CSS if main CSS files fail to load
 */
export function createFallbackCSS() {
  const fallbackCSS = `
    /* Fallback CSS for LinkedIn Automation Extension */
    .vintage-automation-controls {
      font-family: Georgia, 'Times New Roman', Times, serif !important;
      background-color: #F4F1DE !important;
      border: 2px solid #3D405B !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
      position: fixed !important;
      top: 16px !important;
      right: 16px !important;
      z-index: 9999 !important;
      padding: 16px !important;
      max-width: 300px !important;
    }

    .vintage-headline-sm {
      font-size: 16px !important;
      font-weight: 700 !important;
      color: #2F2F2F !important;
      margin: 0 0 12px 0 !important;
    }

    .vintage-button-primary {
      width: 100% !important;
      padding: 8px 16px !important;
      border: 2px solid #E07A5F !important;
      border-radius: 6px !important;
      background-color: #E07A5F !important;
      color: #F4F1DE !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
    }

    .vintage-button-primary:hover {
      background-color: #D66A4A !important;
      border-color: #D66A4A !important;
    }

    .vintage-status-active {
      color: #81B29A !important;
      font-weight: 600 !important;
    }

    .vintage-status-inactive {
      color: #E07A5F !important;
      font-weight: 600 !important;
    }

    #linkedin-automation-indicator {
      animation: pulse 2s infinite !important;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
  `;

  return injectCSSContent(fallbackCSS, 'linkedin-automation-fallback-styles');
}