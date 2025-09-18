// End-to-End Tests for Complete LinkedIn Automation Workflows

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    sendMessage: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn(path => `chrome-extension://test-id/${path}`)
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn()
  }
};

// Mock DOM environment
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://www.linkedin.com/search/results/people/',
    hostname: 'www.linkedin.com',
    pathname: '/search/results/people/'
  },
  writable: true
});

describe('Complete LinkedIn Automation Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = '';

    // Setup default Chrome API responses
    global.chrome.storage.local.get.mockResolvedValue({});
    global.chrome.storage.local.set.mockResolvedValue();
    global.chrome.tabs.query.mockResolvedValue([{
      id: 1,
      url: 'https://www.linkedin.com/search/results/people/',
      active: true
    }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Connection Campaign Workflow', () => {
    test('should execute full campaign from search to analytics', async () => {
      // Import modules dynamically to ensure mocks are set up
      const { LinkedInCore } = await import('../../src/lib/linkedin-core.js');
      const { createCampaign } = await import('../../src/utils/campaign-management.js');
      const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');

      // Step 1: Create a new campaign
      const campaignData = {
        name: 'E2E Test Campaign',
        targetAudience: {
          keywords: 'software engineer',
          location: 'San Francisco',
          industry: 'Technology'
        },
        template: {
          id: 'template1',
          content: 'Hi {{name}}, I noticed we both work in {{industry}}. Let\'s connect!'
        },
        settings: {
          dailyLimit: 5,
          delayBetween: 30
        }
      };

      const campaign = await createCampaign(campaignData);
      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe('draft');

      // Step 2: Setup LinkedIn page simulation
      const mockLinkedInPage = `
        <div class="search-results-container">
          <div data-control-name="search_srp_result" class="search-result">
            <a href="/in/john-doe" class="profile-link">
              <span class="actor-name">John Doe</span>
            </a>
            <button aria-label="Connect with John Doe" class="connect-button">Connect</button>
            <div class="profile-details">
              <span class="headline">Software Engineer at TechCorp</span>
              <span class="location">San Francisco, CA</span>
            </div>
          </div>
          <div data-control-name="search_srp_result" class="search-result">
            <a href="/in/jane-smith" class="profile-link">
              <span class="actor-name">Jane Smith</span>
            </a>
            <button aria-label="Connect with Jane Smith" class="connect-button">Connect</button>
            <div class="profile-details">
              <span class="headline">Senior Developer at StartupInc</span>
              <span class="location">San Francisco, CA</span>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = mockLinkedInPage;

      // Step 3: Initialize LinkedIn automation
      const linkedInCore = new LinkedInCore();
      await linkedInCore.init();

      // Step 4: Detect and process search results
      const searchResults = await linkedInCore.getSearchResults();
      expect(searchResults).toHaveLength(2);
      expect(searchResults[0]).toMatchObject({
        name: 'John Doe',
        profileUrl: expect.stringContaining('/in/john-doe'),
        headline: 'Software Engineer at TechCorp',
        location: 'San Francisco, CA',
        canConnect: true
      });

      // Step 5: Start campaign and send connection requests
      const startResult = await linkedInCore.startCampaign(campaign.id);
      expect(startResult.success).toBe(true);

      // Simulate sending connection requests
      const connectionResults = [];
      for (const profile of searchResults) {
        const result = await linkedInCore.sendConnectionRequest(profile, campaign.template);
        connectionResults.push(result);
      }

      expect(connectionResults).toHaveLength(2);
      expect(connectionResults.every(result => result.success)).toBe(true);

      // Step 6: Verify analytics data collection
      const analyticsEngine = createAnalyticsEngine();
      const analytics = await analyticsEngine.calculateAnalytics({
        startDate: Date.now() - 86400000, // 24 hours ago
        endDate: Date.now()
      });

      expect(analytics.summary.totalConnections).toBeGreaterThanOrEqual(2);
      expect(analytics.campaigns.campaignPerformance).toContainEqual(
        expect.objectContaining({
          id: campaign.id,
          name: campaign.name
        })
      );

      // Step 7: Verify campaign completion
      const campaignStatus = await linkedInCore.getCampaignStatus(campaign.id);
      expect(campaignStatus.connectionsProcessed).toBe(2);
      expect(campaignStatus.status).toBe('active');
    });

    test('should handle error scenarios gracefully', async () => {
      const { LinkedInCore } = await import('../../src/lib/linkedin-core.js');

      // Setup page with no connect buttons (should skip)
      const mockPageWithoutButtons = `
        <div class="search-results-container">
          <div data-control-name="search_srp_result" class="search-result">
            <a href="/in/connected-user" class="profile-link">
              <span class="actor-name">Already Connected User</span>
            </a>
            <span class="connection-status">1st</span>
          </div>
        </div>
      `;
      document.body.innerHTML = mockPageWithoutButtons;

      const linkedInCore = new LinkedInCore();
      await linkedInCore.init();

      const searchResults = await linkedInCore.getSearchResults();
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].canConnect).toBe(false);
    });
  });

  describe('Template A/B Testing Workflow', () => {
    test('should execute complete A/B test from creation to results', async () => {
      const { createABTestingFramework } = await import('../../src/utils/ab-testing-framework.js');

      const framework = createABTestingFramework();

      // Step 1: Create A/B test
      const testConfig = {
        name: 'E2E Template Test',
        variants: [
          {
            id: 'control',
            name: 'Control Template',
            template: 'Hi {{name}}, I would like to connect.'
          },
          {
            id: 'variant',
            name: 'Personal Template',
            template: 'Hi {{name}}, I noticed we both work in {{industry}}. Let\'s connect!'
          }
        ],
        metrics: ['acceptance_rate'],
        significanceLevel: 0.95
      };

      const test = await framework.createTest(testConfig);
      expect(test.id).toBeDefined();

      // Step 2: Start the test
      await framework.startTest(test.id);

      // Step 3: Simulate user assignments and conversions
      const testUsers = Array.from({ length: 60 }, (_, i) => `user${i}`);

      for (const userId of testUsers) {
        const assignment = await framework.assignUserToVariant(test.id, userId);
        expect(assignment).toBeDefined();

        // Simulate different conversion rates for variants
        const conversionRate = assignment.variantId === 'control' ? 0.2 : 0.35;
        if (Math.random() < conversionRate) {
          await framework.recordConversion(test.id, userId, 'acceptance_rate', 1);
        }
      }

      // Step 4: Calculate statistical significance
      const updatedTest = framework.tests.get(test.id);
      const results = await framework.calculateStatisticalSignificance(updatedTest);

      expect(results.sampleSizes.variantA).toBeGreaterThan(20);
      expect(results.sampleSizes.variantB).toBeGreaterThan(20);
      expect(results.pValue).toBeDefined();

      // Step 5: Complete the test
      const completedTest = await framework.stopTest(test.id, 'sample_size_reached');
      expect(completedTest.status).toBe('completed');
      expect(completedTest.results).toBeDefined();
      expect(completedTest.results.recommendations).toBeDefined();
    });
  });

  describe('Response Tracking and Follow-up Workflow', () => {
    test('should track responses and execute follow-up sequences', async () => {
      const { createResponseTrackingSystem } = await import('../../src/utils/response-tracking.js');

      const responseSystem = createResponseTrackingSystem();

      // Step 1: Track sent message
      const messageData = {
        profileId: 'profile123',
        profileName: 'John Doe',
        profileUrl: 'https://linkedin.com/in/john-doe',
        content: 'Hi John, I would like to connect.',
        templateId: 'template1'
      };

      const conversationId = await responseSystem.trackSentMessage(messageData);
      expect(conversationId).toBeDefined();

      // Step 2: Simulate response detection
      const responseData = {
        profileId: 'profile123',
        profileName: 'John Doe',
        content: 'Hi! Yes, I\'d be happy to connect. What can I help you with?',
        timestamp: Date.now()
      };

      const responseResult = await responseSystem.detectResponse(responseData);
      expect(responseResult.response.responseType).toBe('interested');
      expect(responseResult.followupSuggestions).toBeDefined();
      expect(responseResult.followupSuggestions.length).toBeGreaterThan(0);

      // Step 3: Create and execute follow-up sequence
      const followupSequence = await responseSystem.createFollowupSequence({
        name: 'Interested Response Sequence',
        trigger: 'interested',
        steps: [
          {
            type: 'meeting_request',
            delay: 2 * 60 * 60 * 1000, // 2 hours
            template: 'Thanks for connecting! Would you be open to a brief call this week?'
          }
        ]
      });

      expect(followupSequence.id).toBeDefined();

      // Step 4: Schedule follow-up
      const followup = await responseSystem.scheduleFollowup({
        conversationId,
        type: 'meeting_request',
        content: 'Thanks for connecting! Would you be open to a brief call this week?',
        scheduledFor: Date.now() + 1000 // 1 second from now for testing
      });

      expect(followup.status).toBe('scheduled');

      // Step 5: Execute follow-up
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for schedule time
      const executionResult = await responseSystem.executeFollowup(followup.id);
      expect(executionResult.status).toBe('sent');
    });
  });

  describe('Advanced Reporting Workflow', () => {
    test('should generate and deliver comprehensive reports', async () => {
      const { createAdvancedReportingSystem } = await import('../../src/utils/advanced-reporting.js');

      const reportingSystem = createAdvancedReportingSystem();

      // Step 1: Create report template
      const templateConfig = {
        name: 'E2E Test Report',
        type: 'weekly',
        format: 'html',
        sections: ['summary', 'charts', 'insights', 'recommendations'],
        styling: {
          theme: 'modern',
          primaryColor: '#0073b1'
        }
      };

      const template = await reportingSystem.createReportTemplate(templateConfig);
      expect(template.id).toBeDefined();

      // Step 2: Generate report
      const reportOptions = {
        dateRange: {
          startDate: Date.now() - (7 * 24 * 60 * 60 * 1000),
          endDate: Date.now()
        },
        includeRealTime: false
      };

      const report = await reportingSystem.generateReport(template.id, reportOptions);
      expect(report.id).toBeDefined();
      expect(report.content.sections.summary).toBeDefined();
      expect(report.insights).toBeDefined();

      // Step 3: Schedule automated report
      const scheduleConfig = {
        templateId: template.id,
        name: 'Weekly Automation Report',
        frequency: 'weekly',
        time: '09:00',
        delivery: {
          method: 'storage',
          recipients: ['user@example.com']
        }
      };

      const schedule = await reportingSystem.scheduleReport(scheduleConfig);
      expect(schedule.id).toBeDefined();
      expect(schedule.nextRun).toBeGreaterThan(Date.now());

      // Step 4: Test report delivery
      const deliveryConfig = {
        method: 'download',
        format: 'html'
      };

      const deliveryResult = await reportingSystem.deliverReport(report, deliveryConfig);
      expect(deliveryResult.status).toBe('delivered');
    });
  });

  describe('Performance and Optimization Workflow', () => {
    test('should handle large dataset operations efficiently', async () => {
      const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');
      const { createCampaign } = await import('../../src/utils/campaign-management.js');

      // Create large dataset simulation
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        type: 'connection_sent',
        timestamp: Date.now() - (i * 60 * 1000), // Spread over time
        profileId: `profile${i}`,
        campaignId: 'large-campaign'
      }));

      // Setup storage mock with large dataset
      global.chrome.storage.local.get.mockResolvedValue({
        analytics: largeDataset
      });

      const analyticsEngine = createAnalyticsEngine();
      const startTime = Date.now();

      const analytics = await analyticsEngine.calculateAnalytics({
        startDate: Date.now() - (24 * 60 * 60 * 1000),
        endDate: Date.now()
      });

      const executionTime = Date.now() - startTime;

      // Performance assertions
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(analytics.summary.totalConnections).toBe(1000);
      expect(analytics.timeSeries).toBeDefined();

      // Test caching
      const cachedStartTime = Date.now();
      const cachedAnalytics = await analyticsEngine.calculateAnalytics({
        startDate: Date.now() - (24 * 60 * 60 * 1000),
        endDate: Date.now()
      });

      const cachedExecutionTime = Date.now() - cachedStartTime;
      expect(cachedExecutionTime).toBeLessThan(executionTime); // Should be faster with caching
    });

    test('should manage memory efficiently during bulk operations', async () => {
      const { BulkConnectionManager } = await import('../../src/utils/bulk-connection-manager.js');

      // Monitor memory usage (simplified)
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      const bulkManager = new BulkConnectionManager();

      // Process large batch
      const largeBatch = Array.from({ length: 500 }, (_, i) => ({
        id: `profile${i}`,
        name: `User ${i}`,
        profileUrl: `https://linkedin.com/in/user${i}`,
        canConnect: true
      }));

      const results = await bulkManager.processBatch(largeBatch, {
        batchSize: 50,
        delayBetweenBatches: 100
      });

      expect(results.processed).toBe(500);
      expect(results.successful).toBeGreaterThan(0);

      // Memory should not have grown excessively
      if (process.memoryUsage) {
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from LinkedIn page structure changes', async () => {
      const { LinkedInCore } = await import('../../src/lib/linkedin-core.js');

      // Test with changed DOM structure
      const changedPageStructure = `
        <div class="new-search-container">
          <div class="result-card" data-entity-urn="profile1">
            <h3 class="name-text">John Doe</h3>
            <button class="new-connect-btn" data-control-name="connect">Connect</button>
            <p class="job-title">Software Engineer</p>
          </div>
        </div>
      `;
      document.body.innerHTML = changedPageStructure;

      const linkedInCore = new LinkedInCore();
      await linkedInCore.init();

      // Should gracefully handle missing expected elements
      const results = await linkedInCore.getSearchResults();
      expect(results).toBeDefined();

      // Should log fallback behavior
      expect(linkedInCore.adaptToPageChanges).toBeDefined();
    });

    test('should handle network failures gracefully', async () => {
      const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');

      // Simulate storage failure
      global.chrome.storage.local.get.mockRejectedValue(new Error('Storage unavailable'));

      const analyticsEngine = createAnalyticsEngine();

      // Should not throw, should return empty/default results
      const analytics = await analyticsEngine.calculateAnalytics();
      expect(analytics.summary.totalConnections).toBe(0);
    });
  });
});

describe('Integration Test Scenarios', () => {
  test('should handle concurrent campaign execution', async () => {
    const { createCampaign, CampaignManager } = await import('../../src/utils/campaign-management.js');

    const manager = new CampaignManager();

    // Create multiple campaigns
    const campaigns = await Promise.all([
      createCampaign({ name: 'Campaign 1', targetAudience: { keywords: 'engineer' } }),
      createCampaign({ name: 'Campaign 2', targetAudience: { keywords: 'designer' } }),
      createCampaign({ name: 'Campaign 3', targetAudience: { keywords: 'manager' } })
    ]);

    // Start all campaigns concurrently
    const startResults = await Promise.all(
      campaigns.map(campaign => manager.startCampaign(campaign.id))
    );

    expect(startResults.every(result => result.success)).toBe(true);

    // Verify no conflicts in execution
    const statuses = await Promise.all(
      campaigns.map(campaign => manager.getCampaignStatus(campaign.id))
    );

    expect(statuses.every(status => status.status === 'active')).toBe(true);
  });

  test('should maintain data consistency across components', async () => {
    const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');
    const { createResponseTrackingSystem } = await import('../../src/utils/response-tracking.js');

    // Create test data in analytics
    const analyticsEngine = createAnalyticsEngine();
    const responseSystem = createResponseTrackingSystem();

    // Track message and response
    const conversationId = await responseSystem.trackSentMessage({
      profileId: 'consistency-test',
      profileName: 'Test User',
      content: 'Test message'
    });

    await responseSystem.detectResponse({
      profileId: 'consistency-test',
      content: 'Yes, I am interested!'
    });

    // Verify data appears in analytics
    const analytics = await analyticsEngine.calculateAnalytics();
    expect(analytics.summary.totalMessages).toBeGreaterThan(0);
  });
});