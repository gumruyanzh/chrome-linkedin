/**
 * Test Setup Utilities for UI Testing
 * Handles browser setup, extension loading, and test environment configuration
 */

const PuppeteerHelper = require('./puppeteer-helper');
const ScreenshotHelper = require('./screenshot-helper');
const fs = require('fs').promises;
const path = require('path');

class TestSetup {
  constructor() {
    this.puppeteerHelper = null;
    this.screenshotHelper = null;
    this.testConfig = {
      headless: process.env.CI ? true : false, // Headless in CI, headed locally
      slowMo: process.env.CI ? 0 : 50, // Slow down for local debugging
      timeout: 30000,
      screenshotOnFailure: true,
      cleanupScreenshots: true
    };
  }

  /**
   * Initialize test environment
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>}
   */
  async initialize(config = {}) {
    this.testConfig = { ...this.testConfig, ...config };

    // Initialize helpers
    this.puppeteerHelper = new PuppeteerHelper();
    this.screenshotHelper = new ScreenshotHelper({
      screenshotDir: path.join(__dirname, '../screenshots'),
      snapshotDir: path.join(__dirname, '../__snapshots__'),
      diffDir: path.join(__dirname, '../__diffs__')
    });

    // Ensure extension is built
    await this.ensureExtensionBuilt();

    // Launch browser with extension
    const extensionId = await this.puppeteerHelper.launchWithExtension({
      headless: this.testConfig.headless,
      slowMo: this.testConfig.slowMo,
      devtools: !process.env.CI
    });

    console.log(`Test environment initialized with extension ID: ${extensionId}`);

    return {
      puppeteerHelper: this.puppeteerHelper,
      screenshotHelper: this.screenshotHelper,
      extensionId,
      page: this.puppeteerHelper.getPage()
    };
  }

  /**
   * Ensure extension is built before testing
   * @returns {Promise<void>}
   */
  async ensureExtensionBuilt() {
    const extensionPath = path.resolve(__dirname, '../../../dist');
    const manifestPath = path.join(extensionPath, 'manifest.json');

    try {
      await fs.access(manifestPath);
      console.log('Extension build found');
    } catch (error) {
      throw new Error(`
Extension not built. Please run 'npm run build' first.
Expected manifest at: ${manifestPath}
      `);
    }

    // Verify critical files exist
    const criticalFiles = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'content.js',
      'background.js'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(extensionPath, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Critical extension file missing: ${file}`);
      }
    }
  }

  /**
   * Setup test environment for popup testing
   * @returns {Promise<Object>}
   */
  async setupForPopupTesting() {
    const { puppeteerHelper, screenshotHelper, page } = await this.initialize();

    // Navigate to popup
    await puppeteerHelper.openExtensionPopup();

    // Wait for popup to be fully loaded
    await page.waitForSelector('body', { timeout: 10000 });

    // Additional wait for any dynamic content
    await page.waitForTimeout(1000);

    return { puppeteerHelper, screenshotHelper, page };
  }

  /**
   * Setup test environment for LinkedIn integration testing
   * @param {string} linkedinUrl - LinkedIn URL to test
   * @returns {Promise<Object>}
   */
  async setupForLinkedInTesting(linkedinUrl = 'https://www.linkedin.com/') {
    const { puppeteerHelper, screenshotHelper, page } = await this.initialize();

    // Navigate to LinkedIn (this would be a mock or test instance in real testing)
    console.log(`Navigating to: ${linkedinUrl}`);

    // For testing purposes, we'll create a mock LinkedIn page
    const mockLinkedInHtml = this.generateMockLinkedInPage();

    // Create a data URL with our mock HTML
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(mockLinkedInHtml)}`;
    await page.goto(dataUrl, { waitUntil: 'networkidle0' });

    // Wait for page elements to be available
    await page.waitForSelector('.mock-linkedin-page', { timeout: 10000 });

    return { puppeteerHelper, screenshotHelper, page };
  }

  /**
   * Generate mock LinkedIn page for testing
   * @returns {string}
   */
  generateMockLinkedInPage() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Mock LinkedIn - Search Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f3f2ef; }
        .mock-linkedin-page { max-width: 1200px; margin: 0 auto; }
        .search-result {
            background: white;
            margin: 10px 0;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .profile-info { display: flex; align-items: center; margin-bottom: 15px; }
        .profile-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #0066cc;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .profile-details h3 { margin: 0; color: #181818; }
        .profile-details p { margin: 5px 0; color: #666; }
        .connect-btn {
            background: #0066cc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        .connect-btn:hover { background: #004182; }
        .connect-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            opacity: 0.6;
        }
        .loading-indicator {
            display: inline-block;
            margin-left: 10px;
            color: #666;
            font-size: 14px;
        }
        .progress-bar {
            width: 100px;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
            margin: 5px 0;
        }
        .progress-fill {
            height: 100%;
            background: #0066cc;
            width: 0%;
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="mock-linkedin-page">
        <h1>LinkedIn Search Results (Mock)</h1>

        <div class="search-result">
            <div class="profile-info">
                <div class="profile-avatar">JD</div>
                <div class="profile-details">
                    <h3>John Doe</h3>
                    <p>Software Engineer at Tech Corp</p>
                    <p>San Francisco, CA</p>
                </div>
            </div>
            <button class="connect-btn" id="connect-btn-1">Connect</button>
            <span class="loading-indicator" id="loading-1" style="display: none;">
                0% - Starting connection...
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;"></div>
                </div>
            </span>
        </div>

        <div class="search-result">
            <div class="profile-info">
                <div class="profile-avatar">JS</div>
                <div class="profile-details">
                    <h3>Jane Smith</h3>
                    <p>Product Manager at Innovation Inc</p>
                    <p>New York, NY</p>
                </div>
            </div>
            <button class="connect-btn" id="connect-btn-2" disabled>Connecting...</button>
            <span class="loading-indicator" id="loading-2">
                0% - Initializing...
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;"></div>
                </div>
            </span>
        </div>

        <div class="search-result">
            <div class="profile-info">
                <div class="profile-avatar">MJ</div>
                <div class="profile-details">
                    <h3>Michael Johnson</h3>
                    <p>Data Scientist at Analytics Pro</p>
                    <p>Austin, TX</p>
                </div>
            </div>
            <button class="connect-btn" id="connect-btn-3" disabled style="opacity: 0.5;">Connect</button>
            <span class="loading-indicator" id="loading-3">
                0/10 connections sent
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;"></div>
                </div>
            </span>
        </div>
    </div>

    <script>
        // Simulate button states for testing
        document.addEventListener('DOMContentLoaded', function() {
            // Simulate disabled states and 0% loading
            const loadingIndicators = document.querySelectorAll('.loading-indicator');

            // Make some buttons show inactive states
            setTimeout(() => {
                document.getElementById('connect-btn-1').disabled = true;
                document.getElementById('loading-1').style.display = 'inline-block';
            }, 500);
        });
    </script>
</body>
</html>`;
  }

  /**
   * Cleanup test environment
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (this.puppeteerHelper) {
      await this.puppeteerHelper.close();
    }

    if (this.testConfig.cleanupScreenshots && this.screenshotHelper) {
      await this.screenshotHelper.cleanup(24); // Clean up files older than 24 hours
    }
  }

  /**
   * Handle test failure with screenshot
   * @param {string} testName - Name of failed test
   * @param {Error} error - Test error
   * @returns {Promise<void>}
   */
  async handleTestFailure(testName, error) {
    if (this.testConfig.screenshotOnFailure && this.puppeteerHelper) {
      try {
        const page = this.puppeteerHelper.getPage();
        const screenshot = await page.screenshot({ fullPage: true });
        await this.screenshotHelper.saveScreenshot(
          screenshot,
          `FAILED-${testName}`,
          { timestamp: true }
        );
        console.log(`Failure screenshot saved for test: ${testName}`);
      } catch (screenshotError) {
        console.log('Failed to capture failure screenshot:', screenshotError.message);
      }
    }

    console.error(`Test failed: ${testName}`, error);
  }

  /**
   * Wait for extension to be ready
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForExtensionReady(timeout = 10000) {
    if (!this.puppeteerHelper) {
      throw new Error('Test setup not initialized');
    }

    try {
      const page = this.puppeteerHelper.getPage();

      // Try to open popup to verify extension is loaded
      await this.puppeteerHelper.openExtensionPopup();

      // Wait for popup body to be present
      await page.waitForSelector('body', { timeout });

      return true;
    } catch (error) {
      console.error('Extension not ready:', error.message);
      return false;
    }
  }
}

module.exports = TestSetup;