/**
 * Screenshot Helper Utilities
 * Provides utilities for taking, comparing, and managing screenshots for UI testing
 */

const fs = require('fs').promises;
const path = require('path');
// Lazy load looks-same to avoid import issues
let looksSame = null;
const { PNG } = require('pngjs');

class ScreenshotHelper {
  constructor(options = {}) {
    this.screenshotDir = options.screenshotDir || path.join(__dirname, '../screenshots');
    this.snapshotDir = options.snapshotDir || path.join(__dirname, '../__snapshots__');
    this.diffDir = options.diffDir || path.join(__dirname, '../__diffs__');
    this.threshold = options.threshold || 0.1; // Pixel difference threshold
  }

  /**
   * Ensure directories exist
   * @returns {Promise<void>}
   */
  async ensureDirectories() {
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.snapshotDir, { recursive: true });
    await fs.mkdir(this.diffDir, { recursive: true });
  }

  /**
   * Save screenshot with timestamp and description
   * @param {Buffer} screenshotBuffer - Screenshot buffer
   * @param {string} name - Screenshot name
   * @param {Object} options - Save options
   * @returns {Promise<string>}
   */
  async saveScreenshot(screenshotBuffer, name, options = {}) {
    await this.ensureDirectories();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.timestamp === false
      ? `${name}.png`
      : `${name}-${timestamp}.png`;

    const filepath = path.join(this.screenshotDir, filename);
    await fs.writeFile(filepath, screenshotBuffer);

    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
  }

  /**
   * Save baseline screenshot for comparison
   * @param {Buffer} screenshotBuffer - Screenshot buffer
   * @param {string} name - Baseline name
   * @returns {Promise<string>}
   */
  async saveBaseline(screenshotBuffer, name) {
    await this.ensureDirectories();

    const filename = `${name}-baseline.png`;
    const filepath = path.join(this.snapshotDir, filename);
    await fs.writeFile(filepath, screenshotBuffer);

    console.log(`Baseline saved: ${filepath}`);
    return filepath;
  }

  /**
   * Compare screenshot with baseline
   * @param {Buffer} currentScreenshot - Current screenshot buffer
   * @param {string} baselineName - Baseline name to compare against
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>}
   */
  async compareWithBaseline(currentScreenshot, baselineName, options = {}) {
    await this.ensureDirectories();

    const baselineFile = path.join(this.snapshotDir, `${baselineName}-baseline.png`);

    try {
      // Check if baseline exists
      await fs.access(baselineFile);
    } catch (error) {
      // If baseline doesn't exist, save current as baseline
      await this.saveBaseline(currentScreenshot, baselineName);
      return {
        match: true,
        newBaseline: true,
        message: 'New baseline created'
      };
    }

    // Save current screenshot temporarily for comparison
    const currentFilename = `${baselineName}-current-${Date.now()}.png`;
    const currentPath = path.join(this.diffDir, currentFilename);
    await fs.writeFile(currentPath, currentScreenshot);

    // Lazy load looks-same to avoid import issues
    if (!looksSame) {
      try {
        looksSame = require('looks-same');
      } catch (error) {
        resolve({
          match: false,
          error: 'looks-same library not available: ' + error.message,
          diffPath: null
        });
        return;
      }
    }

    // Use looks-same for comparison
    return new Promise((resolve) => {
      looksSame(baselineFile, currentPath, {
        tolerance: (options.threshold || this.threshold) * 100,
        antialiasingTolerance: 2,
        ignoreAntialiasing: true,
        ignoreCaret: true
      }, (error, equal) => {
        if (error) {
          resolve({
            match: false,
            error: error.message,
            diffPath: null
          });
          return;
        }

        if (equal) {
          // Clean up temporary file if images match
          fs.unlink(currentPath).catch(() => {});
          resolve({
            match: true,
            diffPixels: 0,
            diffPercentage: 0,
            threshold: options.threshold || this.threshold
          });
          return;
        }

        // Create diff image if not equal
        const diffFilename = `${baselineName}-diff-${Date.now()}.png`;
        const diffPath = path.join(this.diffDir, diffFilename);

        if (looksSame && looksSame.createDiff) {
          looksSame.createDiff({
            reference: baselineFile,
            current: currentPath,
            diff: diffPath,
            tolerance: (options.threshold || this.threshold) * 100,
            antialiasingTolerance: 2,
            highlightColor: '#ff0000'
          }, (diffError) => {
            console.log(`Diff saved: ${diffPath}`);
            console.log(`Current screenshot saved: ${currentPath}`);

            resolve({
              match: false,
              diffPixels: -1, // looks-same doesn't provide exact pixel count
              diffPercentage: -1, // looks-same doesn't provide exact percentage
              threshold: options.threshold || this.threshold,
              diffPath: diffError ? null : diffPath,
              currentPath
            });
          });
        } else {
          resolve({
            match: false,
            error: 'looks-same.createDiff not available',
            diffPath: null,
            currentPath
          });
        }
      });
    });
  }

  /**
   * Take and compare element screenshot
   * @param {Page} page - Puppeteer page
   * @param {string} selector - Element selector
   * @param {string} name - Screenshot name
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async takeAndCompareElementScreenshot(page, selector, name, options = {}) {
    // Wait for element
    await page.waitForSelector(selector, { timeout: 10000 });

    // Take screenshot of element
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }

    const screenshot = await element.screenshot({
      type: 'png',
      ...options.screenshotOptions
    });

    // Compare with baseline
    return await this.compareWithBaseline(screenshot, name, options);
  }

  /**
   * Validate inactive button state through screenshot
   * @param {Page} page - Puppeteer page
   * @param {string} selector - Button selector
   * @param {string} name - Test name
   * @param {Object} expectedState - Expected button state
   * @returns {Promise<Object>}
   */
  async validateInactiveButtonState(page, selector, name, expectedState = {}) {
    const element = await page.$(selector);
    if (!element) {
      return { found: false, error: `Button ${selector} not found` };
    }

    // Check button properties
    const buttonState = await page.evaluate((sel) => {
      const btn = document.querySelector(sel);
      return {
        disabled: btn.disabled,
        classList: Array.from(btn.classList),
        textContent: btn.textContent.trim(),
        computedStyle: {
          opacity: window.getComputedStyle(btn).opacity,
          pointerEvents: window.getComputedStyle(btn).pointerEvents,
          cursor: window.getComputedStyle(btn).cursor,
          backgroundColor: window.getComputedStyle(btn).backgroundColor,
          color: window.getComputedStyle(btn).color
        }
      };
    }, selector);

    // Validate expected inactive indicators
    const validations = {
      isDisabled: buttonState.disabled === true,
      hasDisabledClass: buttonState.classList.includes('disabled'),
      isNotClickable: buttonState.computedStyle.pointerEvents === 'none',
      isTransparent: parseFloat(buttonState.computedStyle.opacity) < 1,
      hasInactiveText: expectedState.inactiveText ?
        buttonState.textContent.includes(expectedState.inactiveText) : true
    };

    // Take screenshot for visual verification
    const screenshot = await element.screenshot({ type: 'png' });
    const screenshotPath = await this.saveScreenshot(screenshot, `${name}-inactive-button`, { timestamp: true });

    // Compare with baseline if exists
    let comparison = null;
    try {
      comparison = await this.compareWithBaseline(screenshot, `${name}-inactive-button`);
    } catch (error) {
      console.log(`Baseline comparison skipped: ${error.message}`);
    }

    return {
      found: true,
      buttonState,
      validations,
      isInactive: Object.values(validations).some(v => v === true),
      screenshotPath,
      comparison
    };
  }

  /**
   * Validate loading state showing 0% or inactive
   * @param {Page} page - Puppeteer page
   * @param {string} selector - Loading indicator selector
   * @param {string} name - Test name
   * @returns {Promise<Object>}
   */
  async validateZeroLoadingState(page, selector, name) {
    const element = await page.$(selector);
    if (!element) {
      return { found: false, error: `Loading indicator ${selector} not found` };
    }

    // Check loading state
    const loadingState = await page.evaluate((sel) => {
      const indicator = document.querySelector(sel);
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
        hasZeroText: textContent.includes('0%') || textContent.includes('0/') || textContent.includes('Starting'),
        isProgressZero: progressValue === '0' || progressValue === '0%' || progressValue === '0px'
      };
    }, selector);

    // Validate zero/inactive state
    const validations = {
      showsZeroPercent: loadingState.hasZeroText,
      progressIsZero: loadingState.isProgressZero,
      hasStartingText: loadingState.textContent.includes('Starting') ||
                      loadingState.textContent.includes('Initializing') ||
                      loadingState.textContent.includes('0')
    };

    // Take screenshot
    const screenshot = await element.screenshot({ type: 'png' });
    const screenshotPath = await this.saveScreenshot(screenshot, `${name}-zero-loading`, { timestamp: true });

    // Compare with baseline
    let comparison = null;
    try {
      comparison = await this.compareWithBaseline(screenshot, `${name}-zero-loading`);
    } catch (error) {
      console.log(`Baseline comparison skipped: ${error.message}`);
    }

    return {
      found: true,
      loadingState,
      validations,
      isZeroOrInactive: Object.values(validations).some(v => v === true),
      screenshotPath,
      comparison
    };
  }

  /**
   * Clean up old screenshots and diffs
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {Promise<void>}
   */
  async cleanup(maxAgeHours = 24) {
    const directories = [this.screenshotDir, this.diffDir];
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filepath = path.join(dir, file);
          const stats = await fs.stat(filepath);

          if (stats.mtime.getTime() < maxAge) {
            await fs.unlink(filepath);
            console.log(`Cleaned up old file: ${filepath}`);
          }
        }
      } catch (error) {
        console.log(`Cleanup error for ${dir}:`, error.message);
      }
    }
  }
}

module.exports = ScreenshotHelper;