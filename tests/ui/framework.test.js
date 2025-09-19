/**
 * UI Testing Framework Tests
 * Tests for the Puppeteer-based UI testing infrastructure
 */

const TestSetup = require('./utils/test-setup');
const VisualValidator = require('./utils/visual-validator');
const PuppeteerHelper = require('./utils/puppeteer-helper');
const ScreenshotHelper = require('./utils/screenshot-helper');

describe('UI Testing Framework', () => {
  let testSetup;
  let visualValidator;

  beforeAll(async () => {
    // Increase timeout for setup
    jest.setTimeout(60000);
  });

  afterAll(async () => {
    if (testSetup) {
      await testSetup.cleanup();
    }
  });

  describe('1. Core Framework Components', () => {
    test('should initialize PuppeteerHelper', async () => {
      const puppeteerHelper = new PuppeteerHelper();
      expect(puppeteerHelper).toBeDefined();
      expect(typeof puppeteerHelper.launchWithExtension).toBe('function');
      expect(typeof puppeteerHelper.takeScreenshot).toBe('function');
      expect(typeof puppeteerHelper.checkButtonInactiveState).toBe('function');
    });

    test('should initialize ScreenshotHelper', async () => {
      const screenshotHelper = new ScreenshotHelper();
      expect(screenshotHelper).toBeDefined();
      expect(typeof screenshotHelper.saveScreenshot).toBe('function');
      expect(typeof screenshotHelper.compareWithBaseline).toBe('function');
      expect(typeof screenshotHelper.validateInactiveButtonState).toBe('function');
    });

    test('should initialize VisualValidator', async () => {
      visualValidator = new VisualValidator();
      expect(visualValidator).toBeDefined();
      expect(typeof visualValidator.validateButtonInactiveState).toBe('function');
      expect(typeof visualValidator.validateZeroLoadingState).toBe('function');
      expect(typeof visualValidator.batchValidate).toBe('function');
    });

    test('should initialize TestSetup', async () => {
      testSetup = new TestSetup();
      expect(testSetup).toBeDefined();
      expect(typeof testSetup.initialize).toBe('function');
      expect(typeof testSetup.setupForPopupTesting).toBe('function');
      expect(typeof testSetup.setupForLinkedInTesting).toBe('function');
    });
  });

  describe('2. Extension Loading and Browser Setup', () => {
    test('should verify extension build exists', async () => {
      await expect(testSetup.ensureExtensionBuilt()).resolves.not.toThrow();
    });

    test('should launch browser with extension loaded', async () => {
      const { puppeteerHelper, extensionId, page } = await testSetup.initialize({
        headless: true,
        slowMo: 0
      });

      expect(extensionId).toBeDefined();
      expect(extensionId).toMatch(/[a-z]{32}/); // Chrome extension ID format
      expect(page).toBeDefined();
      expect(puppeteerHelper).toBeDefined();

      console.log(`✅ Extension loaded with ID: ${extensionId}`);
    }, 30000);

    test('should open extension popup successfully', async () => {
      const { puppeteerHelper, page } = await testSetup.setupForPopupTesting();

      // Verify popup is loaded
      const url = page.url();
      expect(url).toContain('chrome-extension://');
      expect(url).toContain('popup.html');

      // Verify basic popup elements exist
      const bodyElement = await page.$('body');
      expect(bodyElement).toBeDefined();

      console.log(`✅ Popup opened at: ${url}`);
    }, 30000);
  });

  describe('3. Screenshot and Visual Testing', () => {
    test('should take and save screenshots', async () => {
      const { puppeteerHelper, screenshotHelper, page } = await testSetup.setupForPopupTesting();

      // Take a screenshot
      const screenshot = await puppeteerHelper.takeScreenshot();
      expect(screenshot).toBeDefined();
      expect(Buffer.isBuffer(screenshot)).toBe(true);

      // Save screenshot
      const screenshotPath = await screenshotHelper.saveScreenshot(
        screenshot,
        'framework-test-popup',
        { timestamp: false }
      );

      expect(screenshotPath).toBeDefined();
      expect(screenshotPath).toContain('.png');

      console.log(`✅ Screenshot saved to: ${screenshotPath}`);
    }, 20000);

    test('should create and compare baselines', async () => {
      const { puppeteerHelper, screenshotHelper } = await testSetup.setupForPopupTesting();

      const screenshot = await puppeteerHelper.takeScreenshot();

      // Save as baseline
      const baselinePath = await screenshotHelper.saveBaseline(screenshot, 'test-baseline');
      expect(baselinePath).toBeDefined();

      // Compare with itself (should match perfectly)
      const comparison = await screenshotHelper.compareWithBaseline(screenshot, 'test-baseline');
      expect(comparison.match).toBe(true);
      expect(comparison.diffPixels).toBe(0);

      console.log(`✅ Baseline comparison test passed`);
    }, 20000);
  });

  describe('4. Mock LinkedIn Page Testing', () => {
    test('should load mock LinkedIn page', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      // Verify mock page is loaded
      const title = await page.title();
      expect(title).toContain('Mock LinkedIn');

      // Verify mock elements exist
      const mockPage = await page.$('.mock-linkedin-page');
      expect(mockPage).toBeDefined();

      const searchResults = await page.$$('.search-result');
      expect(searchResults.length).toBeGreaterThan(0);

      console.log(`✅ Mock LinkedIn page loaded with ${searchResults.length} search results`);
    }, 20000);

    test('should find inactive buttons on mock page', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      // Check for disabled connect buttons
      const disabledButtons = await page.$$('.connect-btn:disabled');
      expect(disabledButtons.length).toBeGreaterThan(0);

      // Verify button states
      for (let i = 0; i < disabledButtons.length; i++) {
        const isDisabled = await page.evaluate(
          (btn) => btn.disabled,
          disabledButtons[i]
        );
        expect(isDisabled).toBe(true);
      }

      console.log(`✅ Found ${disabledButtons.length} inactive buttons`);
    }, 15000);

    test('should find zero loading indicators', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      // Check for loading indicators
      const loadingIndicators = await page.$$('.loading-indicator');
      expect(loadingIndicators.length).toBeGreaterThan(0);

      // Verify zero state text
      for (let i = 0; i < loadingIndicators.length; i++) {
        const text = await page.evaluate(
          (indicator) => indicator.textContent,
          loadingIndicators[i]
        );

        const hasZeroState = text.includes('0%') ||
                           text.includes('0/') ||
                           text.includes('Starting') ||
                           text.includes('Initializing');

        expect(hasZeroState).toBe(true);
      }

      console.log(`✅ Found ${loadingIndicators.length} zero loading indicators`);
    }, 15000);
  });

  describe('5. Visual Validator Testing', () => {
    test('should validate inactive button states', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      // Test inactive button validation
      const result = await visualValidator.validateButtonInactiveState(
        page,
        '#connect-btn-2', // This button is disabled in our mock
        'test-inactive-button'
      );

      expect(result.valid).toBe(true);
      expect(result.buttonState.disabled).toBe(true);
      expect(result.validations.individualChecks.isDisabled).toBe(true);
      expect(result.screenshot.path).toBeDefined();

      console.log(`✅ Inactive button validation passed: ${result.validations.overallValidation.reasoning}`);
    }, 25000);

    test('should validate zero loading states', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      // Test zero loading state validation
      const result = await visualValidator.validateZeroLoadingState(
        page,
        '#loading-2', // This loading indicator shows 0% in our mock
        'test-zero-loading'
      );

      expect(result.valid).toBe(true);
      expect(result.loadingState.hasZeroText).toBe(true);
      expect(result.validations.overallValidation.isZeroOrInactive).toBe(true);
      expect(result.screenshot.path).toBeDefined();

      console.log(`✅ Zero loading validation passed: ${result.validations.overallValidation.reasoning}`);
    }, 25000);

    test('should perform batch validation', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      const validations = [
        {
          type: 'button',
          selector: '#connect-btn-2',
          testName: 'batch-button-test',
          expectedState: { inactiveText: 'Connecting' }
        },
        {
          type: 'loading',
          selector: '#loading-2',
          testName: 'batch-loading-test',
          expectedState: {}
        },
        {
          type: 'loading',
          selector: '#loading-3',
          testName: 'batch-loading-test-2',
          expectedState: {}
        }
      ];

      const results = await visualValidator.batchValidate(page, validations);

      expect(results.total).toBe(3);
      expect(results.passed).toBeGreaterThan(0);
      expect(results.details).toHaveLength(3);

      console.log(`✅ Batch validation completed: ${results.passed}/${results.total} passed`);
    }, 30000);
  });

  describe('6. Error Handling and Edge Cases', () => {
    test('should handle missing elements gracefully', async () => {
      const { page } = await testSetup.setupForPopupTesting();

      const result = await visualValidator.validateButtonInactiveState(
        page,
        '#non-existent-button',
        'missing-button-test'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');

      console.log(`✅ Missing element handled gracefully`);
    }, 15000);

    test('should handle screenshot failures gracefully', async () => {
      const { puppeteerHelper } = await testSetup.initialize({ headless: true });

      // Try to screenshot non-existent element
      await expect(
        puppeteerHelper.takeScreenshot({ element: '#non-existent' })
      ).rejects.toThrow();

      console.log(`✅ Screenshot error handling works`);
    }, 15000);

    test('should validate framework cleanup', async () => {
      // Cleanup should not throw errors
      await expect(testSetup.cleanup()).resolves.not.toThrow();

      console.log(`✅ Framework cleanup completed successfully`);
    }, 10000);
  });

  describe('7. Performance and Reliability', () => {
    test('should complete visual validation within time limits', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      const startTime = Date.now();

      await visualValidator.validateButtonInactiveState(
        page,
        '#connect-btn-2',
        'performance-test'
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`✅ Visual validation completed in ${duration}ms`);
    }, 15000);

    test('should handle multiple concurrent validations', async () => {
      const { page } = await testSetup.setupForLinkedInTesting();

      const validationPromises = [
        visualValidator.validateButtonInactiveState(page, '#connect-btn-2', 'concurrent-1'),
        visualValidator.validateZeroLoadingState(page, '#loading-2', 'concurrent-2'),
        visualValidator.validateZeroLoadingState(page, '#loading-3', 'concurrent-3')
      ];

      const results = await Promise.all(validationPromises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.testName).toBeDefined();
      });

      console.log(`✅ Concurrent validations completed successfully`);
    }, 25000);
  });
});