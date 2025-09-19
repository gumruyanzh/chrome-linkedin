/**
 * Jest Global Teardown for UI Testing
 * Runs once after all test suites complete
 */

const fs = require('fs').promises;
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up UI test environment...');

  // Clean up old screenshots (older than 24 hours)
  const screenshotDir = path.join(__dirname, 'screenshots');
  const maxAge = Date.now() - (24 * 60 * 60 * 1000);

  try {
    const files = await fs.readdir(screenshotDir);
    let cleanedCount = 0;

    for (const file of files) {
      if (file.startsWith('FAILED-') || file.includes('-diff-')) {
        const filepath = path.join(screenshotDir, file);
        const stats = await fs.stat(filepath);

        if (stats.mtime.getTime() < maxAge) {
          await fs.unlink(filepath);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🗑️ Cleaned up ${cleanedCount} old test files`);
    }
  } catch (error) {
    console.log('ℹ️ Screenshot cleanup skipped:', error.message);
  }

  // Generate summary report
  const reportPath = path.join(__dirname, 'reports', 'test-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ci: !!process.env.CI
    },
    testRun: {
      completed: true,
      duration: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  };

  try {
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Test summary saved: ${reportPath}`);
  } catch (error) {
    console.log('⚠️ Could not save test summary:', error.message);
  }

  console.log('✅ UI test environment cleanup complete');
};