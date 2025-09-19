/**
 * Jest Setup for UI Testing
 * Global setup and custom matchers for UI tests
 */

const { toMatchImageSnapshot } = require('jest-image-snapshot');

// Extend Jest with image snapshot matcher
expect.extend({ toMatchImageSnapshot });

// Global test configuration
global.UI_TEST_CONFIG = {
  // Timeout settings
  DEFAULT_TIMEOUT: 30000,
  SCREENSHOT_TIMEOUT: 10000,
  NAVIGATION_TIMEOUT: 30000,

  // Screenshot settings
  SCREENSHOT_OPTIONS: {
    threshold: 0.1,
    comparisonMethod: 'pixelmatch',
    failureThresholdType: 'percent',
    failureThreshold: 0.05
  },

  // Browser settings
  BROWSER_OPTIONS: {
    headless: process.env.CI ? true : false,
    slowMo: process.env.CI ? 0 : 100,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  }
};

// Global test utilities
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await global.waitFor(delay);
    }
  }
};

// Custom matchers
expect.extend({
  toBeInactiveButton(received) {
    const { buttonState } = received;

    if (!buttonState) {
      return {
        message: () => 'Expected button state to be provided',
        pass: false
      };
    }

    const isInactive = buttonState.disabled ||
                      parseFloat(buttonState.opacity) < 1 ||
                      buttonState.pointerEvents === 'none' ||
                      buttonState.classList.includes('disabled');

    return {
      message: () => isInactive
        ? 'Expected button to be active but it was inactive'
        : 'Expected button to be inactive but it was active',
      pass: isInactive
    };
  },

  toShowZeroLoading(received) {
    const { loadingState } = received;

    if (!loadingState) {
      return {
        message: () => 'Expected loading state to be provided',
        pass: false
      };
    }

    const isZero = loadingState.hasZeroText ||
                  loadingState.textContent.includes('0%') ||
                  loadingState.textContent.includes('0/') ||
                  loadingState.progressBars.some(bar =>
                    bar.ariaValueNow === '0' || bar.style.width === '0%'
                  );

    return {
      message: () => isZero
        ? 'Expected loading indicator to show progress but it shows zero'
        : 'Expected loading indicator to show zero but it shows progress',
      pass: isZero
    };
  },

  toHaveValidScreenshot(received) {
    if (!received || !received.screenshot) {
      return {
        message: () => 'Expected screenshot data to be provided',
        pass: false
      };
    }

    const hasPath = received.screenshot.path && received.screenshot.path.length > 0;
    const isValidFormat = received.screenshot.path && received.screenshot.path.endsWith('.png');

    return {
      message: () => hasPath && isValidFormat
        ? 'Screenshot is valid'
        : 'Screenshot is invalid or missing',
      pass: hasPath && isValidFormat
    };
  }
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Setup logging
console.log('🧪 UI Test Environment Setup Complete');
console.log(`📁 Running in: ${process.cwd()}`);
console.log(`🖥️  Browser: ${global.UI_TEST_CONFIG.BROWSER_OPTIONS.headless ? 'Headless' : 'Headed'}`);
console.log(`⏱️  Default timeout: ${global.UI_TEST_CONFIG.DEFAULT_TIMEOUT}ms`);

// Export test utilities for use in tests
module.exports = {
  UI_TEST_CONFIG: global.UI_TEST_CONFIG,
  waitFor: global.waitFor,
  retryOperation: global.retryOperation
};