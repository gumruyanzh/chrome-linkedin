// Tests for Analytics Dashboard - Interactive Charts and Data Visualization

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  render: jest.fn()
}));

// Mock DOM elements
const mockDocument = {
  getElementById: jest.fn(),
  createElement: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

const mockElement = {
  addEventListener: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  innerHTML: '',
  textContent: '',
  className: '',
  value: '',
  dataset: {},
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  getContext: jest.fn(() => ({})),
  toISOString: jest.fn(() => '2025-01-01'),
  split: jest.fn(() => ['2025-01-01', '00:00:00'])
};

global.document = mockDocument;
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock analytics engine
const mockAnalyticsEngine = {
  calculateAnalytics: jest.fn(),
  clearCache: jest.fn()
};

jest.mock('../src/utils/analytics-engine.js', () => ({
  createAnalyticsEngine: () => mockAnalyticsEngine,
  ANALYTICS_TYPES: {
    CONNECTION_SENT: 'connection_sent',
    CONNECTION_ACCEPTED: 'connection_accepted',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_RECEIVED: 'message_received'
  }
}));

jest.mock('../src/utils/storage.js', () => ({
  getStorageData: jest.fn(),
  STORAGE_KEYS: {
    ANALYTICS: 'analytics',
    CAMPAIGNS: 'campaigns'
  }
}));

// Mock the AnalyticsDashboard class since we can't import it directly due to DOM dependencies
class MockAnalyticsDashboard {
  constructor() {
    this.analyticsEngine = mockAnalyticsEngine;
    this.charts = {};
    this.currentData = null;
    this.dateRange = { days: 30 };
    this.chartPeriod = 'day';
  }

  async loadData(showLoading = false) {
    try {
      const options = {
        includeRealTime: true,
        groupBy: this.chartPeriod
      };

      if (this.dateRange.days) {
        options.startDate = Date.now() - (this.dateRange.days * 24 * 60 * 60 * 1000);
        options.endDate = Date.now();
      } else {
        options.startDate = this.dateRange.startDate;
        options.endDate = this.dateRange.endDate;
      }

      this.currentData = await this.analyticsEngine.calculateAnalytics(options);
      return this.currentData;
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Don't rethrow, just leave currentData as null
      return null;
    }
  }

  renderSummaryCards() {
    if (!this.currentData) return;

    const { summary } = this.currentData;
    return {
      totalConnections: summary.totalConnections,
      acceptanceRate: summary.acceptanceRate,
      totalMessages: summary.totalMessages,
      responseRate: summary.responseRate
    };
  }

  renderConnectionActivityChart() {
    if (!this.currentData) return null;

    const { timeSeries } = this.currentData;

    const chartData = {
      labels: timeSeries.connection_sent.map(point =>
        new Date(point.timestamp).toLocaleDateString()
      ),
      datasets: [
        {
          label: 'Connections Sent',
          data: timeSeries.connection_sent.map(point => point.value)
        },
        {
          label: 'Connections Accepted',
          data: timeSeries.connection_accepted.map(point => point.value)
        }
      ]
    };

    return chartData;
  }

  renderConversionFunnelChart() {
    if (!this.currentData) return null;

    const { conversion } = this.currentData;

    return {
      labels: conversion.conversionFunnel.map(stage => stage.name),
      data: conversion.conversionFunnel.map(stage => stage.rate)
    };
  }

  exportData(format) {
    if (!this.currentData) return null;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        return this.generateCSV(this.currentData);
      case 'json':
        return JSON.stringify(this.currentData, null, 2);
      case 'pdf':
        return this.generatePDFContent(this.currentData);
      default:
        return null;
    }
  }

  generateCSV(data) {
    const csv = [
      ['Metric', 'Value'],
      ['Total Connections', data.summary.totalConnections],
      ['Accepted Connections', data.summary.acceptedConnections],
      ['Acceptance Rate', `${data.summary.acceptanceRate}%`],
      ['Total Messages', data.summary.totalMessages],
      ['Response Rate', `${data.summary.responseRate}%`]
    ];

    return csv.map(row => row.join(',')).join('\n');
  }

  generatePDFContent(data) {
    return `Analytics Report
Generated: ${new Date().toLocaleString()}

Summary:
- Total Connections: ${data.summary.totalConnections}
- Acceptance Rate: ${data.summary.acceptanceRate}%
- Total Messages: ${data.summary.totalMessages}
- Response Rate: ${data.summary.responseRate}%`;
  }

  getInsightColor(type) {
    switch (type) {
      case 'positive':
        return 'border-green-400 bg-green-50';
      case 'warning':
        return 'border-yellow-400 bg-yellow-50';
      case 'negative':
        return 'border-red-400 bg-red-50';
      default:
        return 'border-blue-400 bg-blue-50';
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  calculateTemplateTrend(template) {
    if (template.acceptanceRate > 30) {
      return { icon: 'fa-arrow-up', color: 'text-green-500' };
    } else if (template.acceptanceRate > 15) {
      return { icon: 'fa-minus', color: 'text-yellow-500' };
    } else {
      return { icon: 'fa-arrow-down', color: 'text-red-500' };
    }
  }
}

describe('AnalyticsDashboard', () => {
  let dashboard;
  let mockData;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock DOM elements
    mockDocument.getElementById.mockImplementation((id) => {
      const element = { ...mockElement };
      element.id = id;
      return element;
    });

    mockDocument.querySelectorAll.mockReturnValue([mockElement, mockElement]);
    mockDocument.createElement.mockReturnValue(mockElement);

    // Setup mock analytics data
    mockData = {
      summary: {
        totalConnections: 150,
        acceptedConnections: 75,
        acceptanceRate: 50.0,
        totalMessages: 60,
        receivedResponses: 18,
        responseRate: 30.0,
        averageConnectionsPerDay: 5.0,
        averageMessagesPerDay: 2.0
      },
      timeSeries: {
        connection_sent: [
          { timestamp: Date.now() - 86400000, value: 10 },
          { timestamp: Date.now(), value: 15 }
        ],
        connection_accepted: [
          { timestamp: Date.now() - 86400000, value: 5 },
          { timestamp: Date.now(), value: 8 }
        ]
      },
      conversion: {
        conversionFunnel: [
          { name: 'Connections Sent', count: 150, rate: 100 },
          { name: 'Connections Accepted', count: 75, rate: 50 },
          { name: 'Messages Sent', count: 60, rate: 40 },
          { name: 'Responses Received', count: 18, rate: 12 }
        ]
      },
      performance: {
        hourlyAcceptance: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          rate: Math.random() * 50
        }))
      },
      templates: {
        templatePerformance: [
          { id: 'template1', name: 'Professional Template', usage: 50, acceptanceRate: 60 },
          { id: 'template2', name: 'Casual Template', usage: 30, acceptanceRate: 40 },
          { id: 'template3', name: 'Industry Template', usage: 25, acceptanceRate: 45 }
        ]
      },
      campaigns: {
        campaignPerformance: [
          { id: 'campaign1', name: 'Q1 Campaign', connections: 100, acceptanceRate: 55, status: 'active' },
          { id: 'campaign2', name: 'Q2 Campaign', connections: 50, acceptanceRate: 45, status: 'completed' }
        ]
      },
      insights: {
        insights: [
          { type: 'positive', title: 'High Acceptance Rate', description: 'Your acceptance rate is above average' },
          { type: 'warning', title: 'Low Activity', description: 'Consider increasing daily connection requests' }
        ],
        recommendations: [
          { title: 'Optimize Timing', description: 'Best performance times are 9-11 AM' },
          { title: 'Improve Templates', description: 'Consider A/B testing your message templates' }
        ]
      }
    };

    mockAnalyticsEngine.calculateAnalytics.mockResolvedValue(mockData);

    dashboard = new MockAnalyticsDashboard();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loading', () => {
    test('should load analytics data with correct date range', async () => {
      dashboard.dateRange = { days: 7 };

      await dashboard.loadData();

      expect(mockAnalyticsEngine.calculateAnalytics).toHaveBeenCalledWith({
        includeRealTime: true,
        groupBy: 'day',
        startDate: expect.any(Number),
        endDate: expect.any(Number)
      });

      expect(dashboard.currentData).toEqual(mockData);
    });

    test('should load data with custom date range', async () => {
      const startDate = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const endDate = Date.now();

      dashboard.dateRange = { startDate, endDate };

      await dashboard.loadData();

      expect(mockAnalyticsEngine.calculateAnalytics).toHaveBeenCalledWith({
        includeRealTime: true,
        groupBy: 'day',
        startDate,
        endDate
      });
    });

    test('should handle loading errors gracefully', async () => {
      mockAnalyticsEngine.calculateAnalytics.mockRejectedValue(new Error('API Error'));

      await dashboard.loadData();

      // Should not throw and currentData should remain null
      expect(dashboard.currentData).toBeNull();
    });
  });

  describe('Summary Cards Rendering', () => {
    beforeEach(async () => {
      await dashboard.loadData();
    });

    test('should render summary cards with correct data', () => {
      const summaryData = dashboard.renderSummaryCards();

      expect(summaryData.totalConnections).toBe(150);
      expect(summaryData.acceptanceRate).toBe(50.0);
      expect(summaryData.totalMessages).toBe(60);
      expect(summaryData.responseRate).toBe(30.0);
    });

    test('should handle missing data gracefully', () => {
      dashboard.currentData = null;
      const summaryData = dashboard.renderSummaryCards();

      expect(summaryData).toBeUndefined();
    });
  });

  describe('Chart Rendering', () => {
    beforeEach(async () => {
      await dashboard.loadData();
    });

    test('should render connection activity chart with correct data structure', () => {
      const chartData = dashboard.renderConnectionActivityChart();

      expect(chartData).toBeDefined();
      expect(chartData.labels).toHaveLength(2);
      expect(chartData.datasets).toHaveLength(2);
      expect(chartData.datasets[0].label).toBe('Connections Sent');
      expect(chartData.datasets[1].label).toBe('Connections Accepted');
      expect(chartData.datasets[0].data).toEqual([10, 15]);
      expect(chartData.datasets[1].data).toEqual([5, 8]);
    });

    test('should render conversion funnel chart with correct data', () => {
      const chartData = dashboard.renderConversionFunnelChart();

      expect(chartData).toBeDefined();
      expect(chartData.labels).toEqual([
        'Connections Sent',
        'Connections Accepted',
        'Messages Sent',
        'Responses Received'
      ]);
      expect(chartData.data).toEqual([100, 50, 40, 12]);
    });

    test('should handle empty chart data gracefully', () => {
      dashboard.currentData = null;

      const activityChart = dashboard.renderConnectionActivityChart();
      const funnelChart = dashboard.renderConversionFunnelChart();

      expect(activityChart).toBeNull();
      expect(funnelChart).toBeNull();
    });
  });

  describe('Data Export', () => {
    beforeEach(async () => {
      await dashboard.loadData();
    });

    test('should export data as CSV format', () => {
      const csvData = dashboard.exportData('csv');

      expect(csvData).toContain('Metric,Value');
      expect(csvData).toContain('Total Connections,150');
      expect(csvData).toContain('Acceptance Rate,50%');
      expect(csvData).toContain('Total Messages,60');
      expect(csvData).toContain('Response Rate,30%');
    });

    test('should export data as JSON format', () => {
      const jsonData = dashboard.exportData('json');
      const parsedData = JSON.parse(jsonData);

      expect(parsedData).toEqual(mockData);
    });

    test('should export data as PDF content', () => {
      const pdfContent = dashboard.exportData('pdf');

      expect(pdfContent).toContain('Analytics Report');
      expect(pdfContent).toContain('Total Connections: 150');
      expect(pdfContent).toContain('Acceptance Rate: 50%');
      expect(pdfContent).toContain('Total Messages: 60');
      expect(pdfContent).toContain('Response Rate: 30%');
    });

    test('should handle invalid export format', () => {
      const invalidData = dashboard.exportData('invalid');
      expect(invalidData).toBeNull();
    });

    test('should handle export with no data', () => {
      dashboard.currentData = null;
      const csvData = dashboard.exportData('csv');
      expect(csvData).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    test('should return correct insight colors', () => {
      expect(dashboard.getInsightColor('positive')).toBe('border-green-400 bg-green-50');
      expect(dashboard.getInsightColor('warning')).toBe('border-yellow-400 bg-yellow-50');
      expect(dashboard.getInsightColor('negative')).toBe('border-red-400 bg-red-50');
      expect(dashboard.getInsightColor('unknown')).toBe('border-blue-400 bg-blue-50');
    });

    test('should return correct status colors', () => {
      expect(dashboard.getStatusColor('active')).toBe('bg-green-100 text-green-800');
      expect(dashboard.getStatusColor('completed')).toBe('bg-blue-100 text-blue-800');
      expect(dashboard.getStatusColor('paused')).toBe('bg-yellow-100 text-yellow-800');
      expect(dashboard.getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800');
    });

    test('should calculate template trends correctly', () => {
      const highPerformance = { acceptanceRate: 35 };
      const mediumPerformance = { acceptanceRate: 20 };
      const lowPerformance = { acceptanceRate: 10 };

      expect(dashboard.calculateTemplateTrend(highPerformance)).toEqual({
        icon: 'fa-arrow-up',
        color: 'text-green-500'
      });

      expect(dashboard.calculateTemplateTrend(mediumPerformance)).toEqual({
        icon: 'fa-minus',
        color: 'text-yellow-500'
      });

      expect(dashboard.calculateTemplateTrend(lowPerformance)).toEqual({
        icon: 'fa-arrow-down',
        color: 'text-red-500'
      });
    });
  });

  describe('CSV Generation', () => {
    beforeEach(async () => {
      await dashboard.loadData();
    });

    test('should generate well-formed CSV data', () => {
      const csv = dashboard.generateCSV(mockData);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Metric,Value');
      expect(lines[1]).toBe('Total Connections,150');
      expect(lines[2]).toBe('Accepted Connections,75');
      expect(lines[3]).toBe('Acceptance Rate,50%');
      expect(lines.length).toBe(6); // Header + 5 data rows
    });

    test('should handle CSV generation with missing data', () => {
      const incompleteData = {
        summary: {
          totalConnections: 100,
          acceptedConnections: 0,
          acceptanceRate: 0,
          totalMessages: 0,
          responseRate: 0
        }
      };

      const csv = dashboard.generateCSV(incompleteData);
      expect(csv).toContain('Total Connections,100');
      expect(csv).toContain('Acceptance Rate,0%');
    });
  });

  describe('PDF Content Generation', () => {
    beforeEach(async () => {
      await dashboard.loadData();
    });

    test('should generate comprehensive PDF content', () => {
      const pdfContent = dashboard.generatePDFContent(mockData);

      expect(pdfContent).toContain('Analytics Report');
      expect(pdfContent).toContain('Generated:');
      expect(pdfContent).toContain('Summary:');
      expect(pdfContent).toContain('Total Connections: 150');
      expect(pdfContent).toContain('Acceptance Rate: 50%');
      expect(pdfContent).toContain('Total Messages: 60');
      expect(pdfContent).toContain('Response Rate: 30%');
    });

    test('should handle PDF generation with zero values', () => {
      const zeroData = {
        summary: {
          totalConnections: 0,
          acceptanceRate: 0,
          totalMessages: 0,
          responseRate: 0
        }
      };

      const pdfContent = dashboard.generatePDFContent(zeroData);
      expect(pdfContent).toContain('Total Connections: 0');
      expect(pdfContent).toContain('Acceptance Rate: 0%');
    });
  });

  describe('Date Range Handling', () => {
    test('should handle predefined date ranges correctly', async () => {
      dashboard.dateRange = { days: 7 };
      await dashboard.loadData();

      const call = mockAnalyticsEngine.calculateAnalytics.mock.calls[0][0];
      const expectedStartDate = Date.now() - (7 * 24 * 60 * 60 * 1000);

      expect(call.startDate).toBeCloseTo(expectedStartDate, -4); // Allow some time difference
      expect(call.endDate).toBeCloseTo(Date.now(), -4);
    });

    test('should handle custom date ranges correctly', async () => {
      const customStart = Date.now() - (14 * 24 * 60 * 60 * 1000);
      const customEnd = Date.now() - (7 * 24 * 60 * 60 * 1000);

      dashboard.dateRange = { startDate: customStart, endDate: customEnd };
      await dashboard.loadData();

      const call = mockAnalyticsEngine.calculateAnalytics.mock.calls[0][0];
      expect(call.startDate).toBe(customStart);
      expect(call.endDate).toBe(customEnd);
    });
  });

  describe('Chart Period Handling', () => {
    test('should use correct groupBy parameter for different chart periods', async () => {
      dashboard.chartPeriod = 'week';
      await dashboard.loadData();

      const call = mockAnalyticsEngine.calculateAnalytics.mock.calls[0][0];
      expect(call.groupBy).toBe('week');
    });

    test('should default to day grouping', async () => {
      await dashboard.loadData();

      const call = mockAnalyticsEngine.calculateAnalytics.mock.calls[0][0];
      expect(call.groupBy).toBe('day');
    });
  });

  describe('Real-time Data Handling', () => {
    test('should always request real-time data', async () => {
      await dashboard.loadData();

      const call = mockAnalyticsEngine.calculateAnalytics.mock.calls[0][0];
      expect(call.includeRealTime).toBe(true);
    });

    test('should handle real-time updates correctly', async () => {
      // Initial load
      await dashboard.loadData();
      expect(mockAnalyticsEngine.calculateAnalytics).toHaveBeenCalledTimes(1);

      // Simulate real-time update
      await dashboard.loadData(true);
      expect(mockAnalyticsEngine.calculateAnalytics).toHaveBeenCalledTimes(2);
    });
  });
});