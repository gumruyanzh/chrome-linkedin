// Comprehensive Analytics Module Tests
import {
  trackEvent,
  ANALYTICS_EVENTS,
  getAnalyticsSummary
} from '../utils/analytics.js';

describe('Analytics Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
  });

  describe('ANALYTICS_EVENTS', () => {
    test('should have all required event types defined', () => {
      expect(ANALYTICS_EVENTS.AUTOMATION_STARTED).toBe('automation_started');
      expect(ANALYTICS_EVENTS.AUTOMATION_STOPPED).toBe('automation_stopped');
      expect(ANALYTICS_EVENTS.CONNECTION_SENT).toBe('connection_sent');
      expect(ANALYTICS_EVENTS.CONNECTION_ACCEPTED).toBe('connection_accepted');
      expect(ANALYTICS_EVENTS.CONNECTION_DECLINED).toBe('connection_declined');
      expect(ANALYTICS_EVENTS.CONNECTION_FAILED).toBe('connection_failed');
      expect(ANALYTICS_EVENTS.MESSAGE_SENT).toBe('message_sent');
      expect(ANALYTICS_EVENTS.PROFILE_VIEWED).toBe('profile_viewed');
      expect(ANALYTICS_EVENTS.SEARCH_PERFORMED).toBe('search_performed');
      expect(ANALYTICS_EVENTS.TEMPLATE_USED).toBe('template_used');
    });

    test('should have unique event values', () => {
      const values = Object.values(ANALYTICS_EVENTS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('trackEvent', () => {
    test('should track event with timestamp', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });
      chrome.storage.local.set.mockResolvedValue();

      await trackEvent(ANALYTICS_EVENTS.CONNECTION_SENT, { profileId: '123' });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics[0].type).toBe(ANALYTICS_EVENTS.CONNECTION_SENT);
      expect(savedData.analytics[0].timestamp).toBeDefined();
      expect(savedData.analytics[0].profileId).toBe('123'); // Data is spread into event
    });

    test('should generate unique event ID', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });
      chrome.storage.local.set.mockResolvedValue();

      await trackEvent(ANALYTICS_EVENTS.CONNECTION_SENT);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics[0].id).toBeDefined();
      expect(savedData.analytics[0].id).toMatch(/^evt_/);
    });

    test('should append to existing analytics', async () => {
      const existingAnalytics = [
        { type: 'existing', timestamp: Date.now(), id: 'evt_1' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics: existingAnalytics });
      chrome.storage.local.set.mockResolvedValue();

      await trackEvent(ANALYTICS_EVENTS.AUTOMATION_STARTED);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics.length).toBe(2);
    });

    test('should limit analytics entries to 1000', async () => {
      const existingAnalytics = Array.from({ length: 1000 }, (_, i) => ({
        type: 'test',
        timestamp: Date.now() - i * 1000,
        id: `evt_${i}`
      }));
      chrome.storage.local.get.mockResolvedValue({ analytics: existingAnalytics });
      chrome.storage.local.set.mockResolvedValue();

      await trackEvent(ANALYTICS_EVENTS.CONNECTION_SENT);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics.length).toBeLessThanOrEqual(1000);
    });

    test('should handle missing data parameter', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });
      chrome.storage.local.set.mockResolvedValue();

      await trackEvent(ANALYTICS_EVENTS.AUTOMATION_STARTED);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics[0].type).toBe(ANALYTICS_EVENTS.AUTOMATION_STARTED);
    });

    test('should not throw on storage error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      // Should not throw, just log error
      await trackEvent(ANALYTICS_EVENTS.CONNECTION_SENT);

      // Verify it tried to get data
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });

    test('should add date field to event', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });
      chrome.storage.local.set.mockResolvedValue();

      await trackEvent(ANALYTICS_EVENTS.CONNECTION_SENT);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics[0].date).toBeDefined();
      expect(savedData.analytics[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getAnalyticsSummary', () => {
    test('should return summary with zero counts when no analytics', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });

      const summary = await getAnalyticsSummary();

      expect(summary.totalEvents).toBe(0);
      expect(summary.connectionsSent).toBe(0);
      expect(summary.connectionsAccepted).toBe(0);
    });

    test('should calculate connections sent', async () => {
      const analytics = [
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: Date.now(), date: '2024-01-01' },
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: Date.now(), date: '2024-01-01' },
        { type: ANALYTICS_EVENTS.CONNECTION_ACCEPTED, timestamp: Date.now(), date: '2024-01-01' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary();

      expect(summary.connectionsSent).toBe(2);
      expect(summary.connectionsAccepted).toBe(1);
    });

    test('should calculate acceptance rate as percentage', async () => {
      const analytics = [
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: Date.now(), date: '2024-01-01' },
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: Date.now(), date: '2024-01-01' },
        { type: ANALYTICS_EVENTS.CONNECTION_ACCEPTED, timestamp: Date.now(), date: '2024-01-01' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary();

      expect(summary.acceptanceRate).toBe(50); // 1 accepted / 2 sent * 100
    });

    test('should filter by date range (days)', async () => {
      const now = Date.now();
      const analytics = [
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: now, date: new Date().toISOString().split('T')[0] },
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: now - 40 * 24 * 60 * 60 * 1000, date: '2024-01-01' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary(7); // Last 7 days

      expect(summary.connectionsSent).toBe(1);
    });

    test('should return null on storage error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const summary = await getAnalyticsSummary();

      expect(summary).toBeNull();
    });

    test('should calculate average daily connections', async () => {
      const analytics = [
        { type: ANALYTICS_EVENTS.CONNECTION_SENT, timestamp: Date.now(), date: '2024-01-01' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary(10);

      expect(summary.averageDaily).toBeDefined();
      expect(summary.averageDaily).toBe(0.1); // 1 connection / 10 days
    });

    test('should include recent activity', async () => {
      const analytics = Array.from({ length: 20 }, (_, i) => ({
        type: ANALYTICS_EVENTS.CONNECTION_SENT,
        timestamp: Date.now() - i * 1000,
        date: '2024-01-01'
      }));
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary();

      expect(summary.recentActivity).toBeDefined();
      expect(summary.recentActivity.length).toBeLessThanOrEqual(10);
    });

    test('should count declined connections', async () => {
      const analytics = [
        { type: ANALYTICS_EVENTS.CONNECTION_DECLINED, timestamp: Date.now(), date: '2024-01-01' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary();

      expect(summary.connectionsDeclined).toBe(1);
    });

    test('should count failed connections', async () => {
      const analytics = [
        { type: ANALYTICS_EVENTS.CONNECTION_FAILED, timestamp: Date.now(), date: '2024-01-01' }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics });

      const summary = await getAnalyticsSummary();

      expect(summary.connectionsFailed).toBe(1);
    });
  });
});
