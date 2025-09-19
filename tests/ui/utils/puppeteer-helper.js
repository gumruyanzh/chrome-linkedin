/**
 * Puppeteer Helper Utilities for Chrome Extension Testing
 * Provides utilities for loading extensions, taking screenshots, and UI testing
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class PuppeteerHelper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionId = null;
  }

  /**
   * Launch Chrome with extension loaded
   * @param {Object} options - Launch options
   * @returns {Promise<void>}
   */
  async launchWithExtension(options = {}) {
    const extensionPath = path.resolve(__dirname, '../../../dist');

    // Verify extension exists
    try {
      await fs.access(extensionPath);
    } catch (error) {
      throw new Error(`Extension not found at ${extensionPath}. Please run 'npm run build' first.`);
    }

    this.browser = await puppeteer.launch({
      headless: options.headless || false, // Default to headed for debugging
      devtools: options.devtools || false,
      slowMo: options.slowMo || 0,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      ...options
    });

    // Get extension ID
    const targets = await this.browser.targets();
    const extensionTarget = targets.find(target =>
      target.type() === 'background_page' || target.type() === 'service_worker'
    );

    if (extensionTarget) {
      this.extensionId = extensionTarget.url().split('/')[2];
      console.log(`Extension loaded with ID: ${this.extensionId}`);
    }

    // Create new page
    this.page = await this.browser.newPage();

    // Set viewport for consistent screenshots
    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    return this.extensionId;
  }

  /**
   * Navigate to extension popup
   * @returns {Promise<void>}
   */
  async openExtensionPopup() {
    if (!this.extensionId) {
      throw new Error('Extension not loaded. Call launchWithExtension() first.');
    }

    const popupUrl = `chrome-extension://${this.extensionId}/popup.html`;
    await this.page.goto(popupUrl, { waitUntil: 'networkidle0' });

    // Wait for popup to be fully loaded
    await this.page.waitForSelector('body', { timeout: 5000 });

    return popupUrl;
  }

  /**
   * Navigate to LinkedIn for testing
   * @param {string} url - LinkedIn URL to navigate to
   * @returns {Promise<void>}
   */
  async navigateToLinkedIn(url = 'https://www.linkedin.com/search/results/people/') {
    await this.page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to be interactive
    await this.page.waitForSelector('body', { timeout: 10000 });
  }

  /**
   * Take screenshot with options
   * @param {Object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot(options = {}) {
    const defaultOptions = {
      type: 'png',
      fullPage: false,
      clip: null,
      ...options
    };

    if (options.element) {
      // Screenshot specific element
      const element = await this.page.$(options.element);
      if (!element) {
        throw new Error(`Element ${options.element} not found`);
      }
      return await element.screenshot(defaultOptions);
    }

    return await this.page.screenshot(defaultOptions);
  }

  /**
   * Wait for element to be in specific state
   * @param {string} selector - CSS selector
   * @param {Object} expectedState - Expected state properties
   * @returns {Promise<boolean>}
   */
  async waitForElementState(selector, expectedState = {}) {
    try {
      await this.page.waitForFunction(
        (sel, state) => {
          const element = document.querySelector(sel);
          if (!element) return false;

          // Check disabled state
          if ('disabled' in state) {
            if (element.disabled !== state.disabled) return false;
          }

          // Check text content
          if ('textContent' in state) {
            if (!element.textContent.includes(state.textContent)) return false;
          }

          // Check class presence
          if ('hasClass' in state) {
            if (!element.classList.contains(state.hasClass)) return false;
          }

          // Check class absence
          if ('doesNotHaveClass' in state) {
            if (element.classList.contains(state.doesNotHaveClass)) return false;
          }

          // Check style properties
          if ('style' in state) {
            const computedStyle = window.getComputedStyle(element);
            for (const [property, value] of Object.entries(state.style)) {
              if (computedStyle[property] !== value) return false;
            }
          }

          return true;
        },
        { timeout: 10000 },
        selector,
        expectedState
      );
      return true;
    } catch (error) {
      console.log(`Element ${selector} did not reach expected state:`, expectedState);
      return false;
    }
  }

  /**
   * Check if button is in inactive state
   * @param {string} selector - Button selector
   * @returns {Promise<Object>}
   */
  async checkButtonInactiveState(selector) {
    const element = await this.page.$(selector);
    if (!element) {
      return { found: false, inactive: false };
    }

    const buttonState = await this.page.evaluate((sel) => {
      const btn = document.querySelector(sel);
      if (!btn) return null;

      return {
        disabled: btn.disabled,
        classList: Array.from(btn.classList),
        textContent: btn.textContent.trim(),
        style: {
          opacity: window.getComputedStyle(btn).opacity,
          pointerEvents: window.getComputedStyle(btn).pointerEvents,
          cursor: window.getComputedStyle(btn).cursor
        }
      };
    }, selector);

    const isInactive = buttonState.disabled ||
                     buttonState.classList.includes('disabled') ||
                     buttonState.style.pointerEvents === 'none' ||
                     buttonState.style.opacity < '1';

    return {
      found: true,
      inactive: isInactive,
      details: buttonState
    };
  }

  /**
   * Check for loading indicators showing 0% or inactive state
   * @param {string} selector - Loading indicator selector
   * @returns {Promise<Object>}
   */
  async checkLoadingState(selector) {
    const element = await this.page.$(selector);
    if (!element) {
      return { found: false, isZeroPercent: false };
    }

    const loadingState = await this.page.evaluate((sel) => {
      const indicator = document.querySelector(sel);
      if (!indicator) return null;

      const textContent = indicator.textContent.trim();
      const progressBars = indicator.querySelectorAll('[role="progressbar"], .progress-bar, .loading-bar');

      let progressValue = null;
      if (progressBars.length > 0) {
        const progressBar = progressBars[0];
        progressValue = progressBar.getAttribute('aria-valuenow') ||
                       progressBar.getAttribute('value') ||
                       progressBar.style.width;
      }

      return {
        textContent,
        progressValue,
        classList: Array.from(indicator.classList),
        hasZeroText: textContent.includes('0%') || textContent.includes('0/'),
        style: {
          display: window.getComputedStyle(indicator).display,
          visibility: window.getComputedStyle(indicator).visibility
        }
      };
    }, selector);

    const isZeroPercent = loadingState.hasZeroText ||
                         loadingState.progressValue === '0' ||
                         loadingState.progressValue === '0%';

    return {
      found: true,
      isZeroPercent,
      details: loadingState
    };
  }

  /**
   * Close browser
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.extensionId = null;
    }
  }

  /**
   * Get current page instance
   * @returns {Page}
   */
  getPage() {
    return this.page;
  }

  /**
   * Get browser instance
   * @returns {Browser}
   */
  getBrowser() {
    return this.browser;
  }

  /**
   * Get extension ID
   * @returns {string}
   */
  getExtensionId() {
    return this.extensionId;
  }
}

module.exports = PuppeteerHelper;