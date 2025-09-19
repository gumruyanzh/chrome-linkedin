/**
 * Visual Validator for UI State Testing
 * Specialized tools for validating inactive states, loading indicators, and button states through screenshots
 */

const ScreenshotHelper = require('./screenshot-helper');
const path = require('path');

class VisualValidator {
  constructor(options = {}) {
    this.screenshotHelper = new ScreenshotHelper(options);
    this.validationRules = {
      inactiveButton: {
        disabled: true,
        opacity: { max: 0.8 },
        pointerEvents: 'none',
        cursor: ['not-allowed', 'default'],
        classNames: ['disabled', 'inactive', 'loading']
      },
      zeroLoading: {
        textPatterns: ['0%', '0/', 'Starting', 'Initializing', 'Waiting'],
        progressValue: ['0', '0%', '0px'],
        ariaValueNow: '0'
      }
    };
  }

  /**
   * Validate button inactive state with comprehensive checks
   * @param {Page} page - Puppeteer page
   * @param {string} selector - Button selector
   * @param {string} testName - Test identifier
   * @param {Object} expectedState - Expected inactive state properties
   * @returns {Promise<Object>}
   */
  async validateButtonInactiveState(page, selector, testName, expectedState = {}) {
    console.log(`🔍 Validating inactive button state: ${selector}`);

    // Check if element exists
    const element = await page.$(selector);
    if (!element) {
      return {
        valid: false,
        error: `Button element '${selector}' not found`,
        testName,
        timestamp: new Date().toISOString()
      };
    }

    // Get comprehensive button state
    const buttonState = await page.evaluate((sel) => {
      const btn = document.querySelector(sel);
      if (!btn) return null;

      const computedStyle = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();

      return {
        // DOM properties
        disabled: btn.disabled,
        type: btn.type,
        tagName: btn.tagName,
        id: btn.id,
        className: btn.className,
        textContent: btn.textContent.trim(),

        // Computed styles
        opacity: computedStyle.opacity,
        pointerEvents: computedStyle.pointerEvents,
        cursor: computedStyle.cursor,
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        border: computedStyle.border,
        transform: computedStyle.transform,

        // Position and visibility
        visible: rect.width > 0 && rect.height > 0,
        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },

        // Aria attributes
        ariaDisabled: btn.getAttribute('aria-disabled'),
        ariaLabel: btn.getAttribute('aria-label'),
        role: btn.getAttribute('role'),

        // Class list
        classList: Array.from(btn.classList),

        // Parent context
        parentVisible: btn.offsetParent !== null
      };
    }, selector);

    // Validate against inactive state rules
    const validations = this.validateButtonProperties(buttonState, expectedState);

    // Take screenshot for visual verification
    const screenshot = await element.screenshot({
      type: 'png',
      omitBackground: false
    });

    const screenshotPath = await this.screenshotHelper.saveScreenshot(
      screenshot,
      `${testName}-button-inactive`,
      { timestamp: true }
    );

    // Compare with baseline if exists
    let visualComparison = null;
    try {
      visualComparison = await this.screenshotHelper.compareWithBaseline(
        screenshot,
        `${testName}-button-inactive`,
        { threshold: 0.05 }
      );
    } catch (error) {
      console.log(`Visual comparison note: ${error.message}`);
    }

    // Overall validation result
    const isValidInactive = validations.overallValidation.isInactive;

    console.log(`✅ Button validation complete - Inactive: ${isValidInactive}`);

    return {
      valid: isValidInactive,
      testName,
      selector,
      buttonState,
      validations,
      screenshot: {
        path: screenshotPath,
        comparison: visualComparison
      },
      timestamp: new Date().toISOString(),
      expectedState
    };
  }

  /**
   * Validate loading indicator showing 0% or inactive state
   * @param {Page} page - Puppeteer page
   * @param {string} selector - Loading indicator selector
   * @param {string} testName - Test identifier
   * @param {Object} expectedState - Expected loading state
   * @returns {Promise<Object>}
   */
  async validateZeroLoadingState(page, selector, testName, expectedState = {}) {
    console.log(`🔍 Validating zero loading state: ${selector}`);

    const element = await page.$(selector);
    if (!element) {
      return {
        valid: false,
        error: `Loading indicator '${selector}' not found`,
        testName,
        timestamp: new Date().toISOString()
      };
    }

    // Get loading indicator state
    const loadingState = await page.evaluate((sel) => {
      const indicator = document.querySelector(sel);
      if (!indicator) return null;

      const computedStyle = window.getComputedStyle(indicator);
      const textContent = indicator.textContent.trim();

      // Look for progress elements
      const progressBars = indicator.querySelectorAll(
        '[role="progressbar"], .progress-bar, .loading-bar, progress'
      );

      const progressInfo = Array.from(progressBars).map(bar => ({
        tagName: bar.tagName,
        value: bar.value,
        max: bar.max,
        ariaValueNow: bar.getAttribute('aria-valuenow'),
        ariaValueMax: bar.getAttribute('aria-valuemax'),
        style: {
          width: bar.style.width,
          transform: bar.style.transform
        }
      }));

      // Look for percentage text
      const percentageMatches = textContent.match(/(\d+)%/g) || [];
      const fractionMatches = textContent.match(/(\d+)\/(\d+)/g) || [];

      return {
        textContent,
        innerHTML: indicator.innerHTML,
        visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
        opacity: computedStyle.opacity,
        classList: Array.from(indicator.classList),
        progressBars: progressInfo,
        percentageMatches,
        fractionMatches,
        hasZeroText: this.checkZeroPatterns(textContent),
        computedStyle: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity
        }
      };
    }, selector);

    // Validate zero/inactive loading state
    const validations = this.validateLoadingProperties(loadingState, expectedState);

    // Take screenshot
    const screenshot = await element.screenshot({
      type: 'png',
      omitBackground: false
    });

    const screenshotPath = await this.screenshotHelper.saveScreenshot(
      screenshot,
      `${testName}-loading-zero`,
      { timestamp: true }
    );

    // Visual comparison
    let visualComparison = null;
    try {
      visualComparison = await this.screenshotHelper.compareWithBaseline(
        screenshot,
        `${testName}-loading-zero`,
        { threshold: 0.05 }
      );
    } catch (error) {
      console.log(`Visual comparison note: ${error.message}`);
    }

    const isValidZeroState = validations.overallValidation.isZeroOrInactive;

    console.log(`✅ Loading validation complete - Zero state: ${isValidZeroState}`);

    return {
      valid: isValidZeroState,
      testName,
      selector,
      loadingState,
      validations,
      screenshot: {
        path: screenshotPath,
        comparison: visualComparison
      },
      timestamp: new Date().toISOString(),
      expectedState
    };
  }

  /**
   * Validate button properties against inactive state rules
   * @param {Object} buttonState - Button state object
   * @param {Object} expectedState - Expected state
   * @returns {Object}
   */
  validateButtonProperties(buttonState, expectedState) {
    const rules = this.validationRules.inactiveButton;

    const checks = {
      // Core disabled checks
      isDisabled: buttonState.disabled === true,
      hasDisabledAttribute: buttonState.ariaDisabled === 'true',

      // Visual inactive indicators
      hasLowOpacity: parseFloat(buttonState.opacity) <= (rules.opacity.max || 0.8),
      hasNoPointerEvents: buttonState.pointerEvents === 'none',
      hasInactiveCursor: rules.cursor.includes(buttonState.cursor),

      // Class-based indicators
      hasDisabledClass: rules.classNames.some(className =>
        buttonState.classList.includes(className)
      ),

      // Text-based indicators
      hasInactiveText: expectedState.inactiveText ?
        buttonState.textContent.toLowerCase().includes(expectedState.inactiveText.toLowerCase()) : true,

      // Visibility checks
      isVisible: buttonState.visible && buttonState.parentVisible,

      // Additional custom checks
      customValidations: this.runCustomValidations(buttonState, expectedState)
    };

    // Overall assessment
    const inactiveIndicators = [
      checks.isDisabled,
      checks.hasDisabledAttribute,
      checks.hasLowOpacity,
      checks.hasNoPointerEvents,
      checks.hasInactiveCursor,
      checks.hasDisabledClass
    ];

    const hasAnyInactiveIndicator = inactiveIndicators.some(check => check === true);

    return {
      individualChecks: checks,
      overallValidation: {
        isInactive: hasAnyInactiveIndicator,
        activeIndicatorCount: inactiveIndicators.filter(Boolean).length,
        reasoning: this.generateInactiveReasoning(checks)
      }
    };
  }

  /**
   * Validate loading properties for zero/inactive state
   * @param {Object} loadingState - Loading state object
   * @param {Object} expectedState - Expected state
   * @returns {Object}
   */
  validateLoadingProperties(loadingState, expectedState) {
    const rules = this.validationRules.zeroLoading;

    const checks = {
      // Text pattern checks
      hasZeroPercentage: loadingState.percentageMatches.includes('0%'),
      hasZeroFraction: loadingState.fractionMatches.some(match => match.startsWith('0/')),
      hasStartingText: rules.textPatterns.some(pattern =>
        loadingState.textContent.toLowerCase().includes(pattern.toLowerCase())
      ),

      // Progress bar checks
      hasZeroProgress: loadingState.progressBars.some(bar =>
        bar.value === 0 ||
        bar.ariaValueNow === '0' ||
        bar.style.width === '0%' ||
        bar.style.width === '0px'
      ),

      // Visibility checks
      isVisible: loadingState.visible,
      hasAppropriateOpacity: parseFloat(loadingState.opacity) > 0.3,

      // Content checks
      hasZeroTextPattern: loadingState.hasZeroText,

      // Custom validations
      customValidations: this.runCustomLoadingValidations(loadingState, expectedState)
    };

    // Overall assessment
    const zeroIndicators = [
      checks.hasZeroPercentage,
      checks.hasZeroFraction,
      checks.hasStartingText,
      checks.hasZeroProgress,
      checks.hasZeroTextPattern
    ];

    const hasZeroIndicator = zeroIndicators.some(check => check === true);

    return {
      individualChecks: checks,
      overallValidation: {
        isZeroOrInactive: hasZeroIndicator && checks.isVisible,
        zeroIndicatorCount: zeroIndicators.filter(Boolean).length,
        reasoning: this.generateZeroStateReasoning(checks)
      }
    };
  }

  /**
   * Check for zero patterns in text
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  checkZeroPatterns(text) {
    const zeroPatterns = [
      /0%/,
      /0\s*\/\s*\d+/,
      /starting/i,
      /initializing/i,
      /waiting/i,
      /loading\.\.\./i,
      /0\s*(connections?|requests?|items?)/i
    ];

    return zeroPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Run custom validation rules
   * @param {Object} state - Element state
   * @param {Object} expectedState - Expected state
   * @returns {Object}
   */
  runCustomValidations(state, expectedState) {
    const customChecks = {};

    if (expectedState.customRules) {
      for (const [ruleName, ruleFunction] of Object.entries(expectedState.customRules)) {
        try {
          customChecks[ruleName] = ruleFunction(state);
        } catch (error) {
          customChecks[ruleName] = false;
          console.warn(`Custom validation '${ruleName}' failed:`, error.message);
        }
      }
    }

    return customChecks;
  }

  /**
   * Run custom loading validation rules
   * @param {Object} loadingState - Loading state
   * @param {Object} expectedState - Expected state
   * @returns {Object}
   */
  runCustomLoadingValidations(loadingState, expectedState) {
    return this.runCustomValidations(loadingState, expectedState);
  }

  /**
   * Generate reasoning for inactive state validation
   * @param {Object} checks - Validation checks
   * @returns {string}
   */
  generateInactiveReasoning(checks) {
    const reasons = [];

    if (checks.isDisabled) reasons.push('element is disabled');
    if (checks.hasDisabledAttribute) reasons.push('has aria-disabled attribute');
    if (checks.hasLowOpacity) reasons.push('has reduced opacity');
    if (checks.hasNoPointerEvents) reasons.push('pointer events disabled');
    if (checks.hasInactiveCursor) reasons.push('has inactive cursor style');
    if (checks.hasDisabledClass) reasons.push('has disabled CSS class');

    return reasons.length > 0 ?
      `Button appears inactive because: ${reasons.join(', ')}` :
      'Button appears active - no inactive indicators found';
  }

  /**
   * Generate reasoning for zero state validation
   * @param {Object} checks - Validation checks
   * @returns {string}
   */
  generateZeroStateReasoning(checks) {
    const reasons = [];

    if (checks.hasZeroPercentage) reasons.push('shows 0% in text');
    if (checks.hasZeroFraction) reasons.push('shows 0/X format');
    if (checks.hasStartingText) reasons.push('contains starting/initializing text');
    if (checks.hasZeroProgress) reasons.push('progress bar at 0%');
    if (checks.hasZeroTextPattern) reasons.push('matches zero state text pattern');

    return reasons.length > 0 ?
      `Loading indicator shows zero state because: ${reasons.join(', ')}` :
      'Loading indicator does not show zero state';
  }

  /**
   * Batch validate multiple elements
   * @param {Page} page - Puppeteer page
   * @param {Array} validations - Array of validation configs
   * @returns {Promise<Object>}
   */
  async batchValidate(page, validations) {
    const results = {
      passed: 0,
      failed: 0,
      total: validations.length,
      details: []
    };

    for (const validation of validations) {
      try {
        let result;

        if (validation.type === 'button') {
          result = await this.validateButtonInactiveState(
            page,
            validation.selector,
            validation.testName,
            validation.expectedState
          );
        } else if (validation.type === 'loading') {
          result = await this.validateZeroLoadingState(
            page,
            validation.selector,
            validation.testName,
            validation.expectedState
          );
        }

        if (result.valid) {
          results.passed++;
        } else {
          results.failed++;
        }

        results.details.push(result);

      } catch (error) {
        results.failed++;
        results.details.push({
          valid: false,
          error: error.message,
          testName: validation.testName,
          selector: validation.selector
        });
      }
    }

    return results;
  }
}

module.exports = VisualValidator;